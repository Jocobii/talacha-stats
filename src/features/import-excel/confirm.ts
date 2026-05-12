/**
 * features/import-excel/confirm.ts
 *
 * Responsabilidad única: persistir los datos de una importación confirmada.
 * Reemplaza `confirmBulkImport` de lib/excel-import-bulk.ts.
 *
 * ANTES: ~5 queries por jugador → O(N) queries → lento y riesgoso con 40+ filas.
 * AHORA: 5 queries fijas para goleadores, 3 para standings, sin importar el tamaño.
 *
 * Estrategia batch para GOLEADORES:
 *   Pre-load  1: equipos existentes en la liga (inArray)
 *   Tx paso   1: INSERT nuevos jugadores ... VALUES (...), (...) RETURNING
 *   Tx paso   2: INSERT nuevos equipos   ... VALUES (...), (...) RETURNING
 *   Tx paso   3: INSERT player_registrations onConflictDoNothing (bulk)
 *   Tx paso   4: INSERT player_season_stats onConflictDoUpdate   (bulk)
 *   Tx paso   5: INSERT player_season_stats_snapshot onConflictDoUpdate (bulk)
 *
 * Estrategia batch para STANDINGS:
 *   Pre-load  1: equipos existentes en la liga (inArray)
 *   Tx paso   1: INSERT nuevos equipos (bulk)
 *   Tx paso   2: INSERT team_standings_snapshot onConflictDoUpdate (bulk)
 *
 * Exportaciones publicas:
 *   confirmImport(input) -> ConfirmResult
 */

import { and, eq, inArray, sql } from "drizzle-orm";
import {
	db,
	players,
	teams,
	playerRegistrations,
	playerSeasonStats,
	playerSeasonStatsSnapshot,
	playerProfiles,
	teamStandingsSnapshot,
} from "@/db";
import { sanitizeName } from "@/shared/lib/normalize";

import { normalizePlayerName, fingerprintPlayer } from "@/shared/lib/normalize";
import type { ConfirmImportInput, ConfirmImportResult, ParsedRow } from "./types";

import type { ParsedBulkImport, GoleadoresRow, StandingsRow, BulkImportType } from "./parser";

/** Tipo del `tx` que recibe el callback de db.transaction — derivado sin imports de drizzle. */
type DbTx = Parameters<Parameters<typeof db.transaction>[0]>[0];

// ---------------------------------------------------------------------------
// Tipos publicos
// ---------------------------------------------------------------------------

export type ConfirmInput = {
	leagueId: string;
	parsed: ParsedBulkImport;
	/**
	 * rawName -> playerId existente, o "NEW" para crear jugador nuevo.
	 * Viene del paso de preview (playerResolutions del resolver).
	 * Si no se provee una entrada, se crea como nuevo.
	 */
	playerResolutions?: Record<string, string>;
};

export type ConfirmResult = {
	type: BulkImportType;
	/** Filas insertadas o actualizadas */
	upserted: number;
	/** Entidades nuevas creadas (jugadores + equipos) */
	created: number;
	warnings: string[];
};

// ---------------------------------------------------------------------------
// API publica
// ---------------------------------------------------------------------------

/**
 * Persiste los datos de una importacion confirmada dentro de una transaccion.
 * Numero de queries constante independientemente del tamano del Excel.
 */
export async function confirmImport(input: ConfirmInput): Promise<ConfirmResult> {
	const { leagueId, parsed, playerResolutions = {} } = input;

	if (parsed.type === "goleadores") {
		return confirmGoleadores(
			parsed.rows as GoleadoresRow[],
			parsed.jornada,
			leagueId,
			playerResolutions,
		);
	}

	return confirmStandings(parsed.rows as StandingsRow[], parsed.jornada ?? 1, leagueId);
}

// ---------------------------------------------------------------------------
// Confirm goleadores - batch
// ---------------------------------------------------------------------------

async function confirmGoleadores(
	rows: GoleadoresRow[],
	jornada: number | undefined,
	leagueId: string,
	playerResolutions: Record<string, string>,
): Promise<ConfirmResult> {
	const warnings: string[] = [];
	let created = 0;

	// Pre-load: equipos existentes en la liga
	const uniqueTeamNames = [...new Set(rows.map((r) => sanitizeName(r.teamName)).filter(Boolean))];

	const existingTeams: { id: string; name: string }[] =
		uniqueTeamNames.length > 0
			? await db.query.teams.findMany({
					where: and(eq(teams.leagueId, leagueId), inArray(teams.name, uniqueTeamNames)),
					columns: { id: true, name: true },
				})
			: [];

	const teamNameToId = new Map<string, string>(existingTeams.map((t) => [t.name, t.id]));

	await db.transaction(async (tx: DbTx) => {
		// Paso 1: Crear nuevos jugadores en batch
		const newPlayerRows = rows.filter((r) => {
			const resolution = playerResolutions[r.rawName];
			return !resolution || resolution === "NEW";
		});

		const rawNameToPlayerId = new Map<string, string>(
			Object.entries(playerResolutions).filter(([, v]) => v && v !== "NEW") as [string, string][],
		);

		if (newPlayerRows.length > 0) {
			const inserted = await tx
				.insert(players)
				.values(newPlayerRows.map((r) => ({ fullName: sanitizeName(r.rawName) })))
				.returning({ id: players.id, fullName: players.fullName });

			for (let i = 0; i < newPlayerRows.length; i++) {
				rawNameToPlayerId.set(newPlayerRows[i].rawName, inserted[i].id);
				created++;
			}
		}

		// Paso 2: Crear nuevos equipos en batch
		const missingTeamNames = uniqueTeamNames.filter((n) => !teamNameToId.has(n));

		if (missingTeamNames.length > 0) {
			const insertedTeams = await tx
				.insert(teams)
				.values(missingTeamNames.map((name) => ({ name, leagueId })))
				.returning({ id: teams.id, name: teams.name });

			for (const t of insertedTeams) {
				teamNameToId.set(t.name, t.id);
				created++;
			}
		}

		// Paso 3: Upsert registrations en batch
		const registrationValues = rows
			.map((r) => {
				const playerId = rawNameToPlayerId.get(r.rawName);
				const teamId = r.teamName ? teamNameToId.get(sanitizeName(r.teamName)) : undefined;
				if (!playerId || !teamId) return null;
				return { playerId, teamId, leagueId };
			})
			.filter((v): v is NonNullable<typeof v> => v !== null);

		// Dedup registrations por (playerId, leagueId) — UNIQUE constraint de la tabla
		const regMap = new Map<string, { playerId: string; teamId: string; leagueId: string }>();
		for (const r of registrationValues) {
			regMap.set(`${r.playerId}:${r.leagueId}`, r);
		}
		const regValuesDeduped = [...regMap.values()];

		if (regValuesDeduped.length > 0) {
			await tx.insert(playerRegistrations).values(regValuesDeduped).onConflictDoNothing();
		}

		// Paso 4: Upsert player_season_stats en batch
		const statsValuesRaw = rows
			.map((r) => {
				const playerId = rawNameToPlayerId.get(r.rawName);
				if (!playerId) {
					warnings.push(`No se encontro playerId para "${r.rawName}" - fila omitida.`);
					return null;
				}
				const teamId = r.teamName ? (teamNameToId.get(sanitizeName(r.teamName)) ?? null) : null;
				return {
					playerId,
					leagueId,
					teamId,
					goals: r.goals,
					assists: r.assists ?? 0,
					yellowCards: r.yellowCards ?? 0,
					redCards: r.redCards ?? 0,
					matchesPlayed: r.matchesPlayed ?? 0,
					jornada: jornada ?? null,
					updatedAt: new Date(),
				};
			})
			.filter((v): v is NonNullable<typeof v> => v !== null);

		// Dedup por (playerId, leagueId) — mismo jugador dos veces en el Excel
		// Se conserva la última ocurrencia (orden del Excel)
		const statsMap = new Map<string, (typeof statsValuesRaw)[0]>();
		for (const s of statsValuesRaw) {
			statsMap.set(`${s.playerId}:${s.leagueId}`, s);
		}
		const statsValues = [...statsMap.values()];

		if (statsValues.length > 0) {
			await tx
				.insert(playerSeasonStats)
				.values(statsValues)
				.onConflictDoUpdate({
					target: [playerSeasonStats.playerProfileId, playerSeasonStats.leagueId],
					set: {
						goals: playerSeasonStats.goals,
						assists: playerSeasonStats.assists,
						yellowCards: playerSeasonStats.yellowCards,
						redCards: playerSeasonStats.redCards,
						matchesPlayed: playerSeasonStats.matchesPlayed,
						jornada: playerSeasonStats.jornada,
						teamId: playerSeasonStats.teamId,
						updatedAt: new Date(),
					},
				});
		}

		// Paso 5: Upsert snapshot por jornada en batch
		if (jornada != null) {
			const snapshotValuesRaw = statsValues.map((s) => ({
				playerId: s.playerId,
				leagueId: s.leagueId,
				teamId: s.teamId,
				jornada,
				goals: s.goals,
				assists: s.assists,
				yellowCards: s.yellowCards,
				redCards: s.redCards,
				matchesPlayed: s.matchesPlayed,
				importedAt: new Date(),
			}));

			// Dedup por (playerId, leagueId, jornada)
			const snapMap = new Map<string, (typeof snapshotValuesRaw)[0]>();
			for (const s of snapshotValuesRaw) {
				snapMap.set(`${s.playerId}:${s.leagueId}:${s.jornada}`, s);
			}
			const snapshotValues = [...snapMap.values()];

			if (snapshotValues.length > 0) {
				await tx
					.insert(playerSeasonStatsSnapshot)
					.values(snapshotValues)
					.onConflictDoUpdate({
						target: [
							playerSeasonStatsSnapshot.playerId,
							playerSeasonStatsSnapshot.leagueId,
							playerSeasonStatsSnapshot.jornada,
						],
						set: {
							goals: playerSeasonStatsSnapshot.goals,
							assists: playerSeasonStatsSnapshot.assists,
							yellowCards: playerSeasonStatsSnapshot.yellowCards,
							redCards: playerSeasonStatsSnapshot.redCards,
							matchesPlayed: playerSeasonStatsSnapshot.matchesPlayed,
							teamId: playerSeasonStatsSnapshot.teamId,
							importedAt: new Date(),
						},
					});
			}
		}
	});

	return {
		type: "goleadores",
		upserted: rows.length - warnings.length,
		created,
		warnings,
	};
}

// ---------------------------------------------------------------------------
// Confirm standings - batch
// ---------------------------------------------------------------------------

async function confirmStandings(
	rows: StandingsRow[],
	jornada: number,
	leagueId: string,
): Promise<ConfirmResult> {
	let created = 0;

	// Pre-load: equipos existentes en la liga
	const uniqueTeamNames = [...new Set(rows.map((r) => sanitizeName(r.teamName)).filter(Boolean))];

	const existingTeams: { id: string; name: string }[] =
		uniqueTeamNames.length > 0
			? await db.query.teams.findMany({
					where: and(eq(teams.leagueId, leagueId), inArray(teams.name, uniqueTeamNames)),
					columns: { id: true, name: true },
				})
			: [];

	const teamNameToId = new Map<string, string>(existingTeams.map((t) => [t.name, t.id]));

	await db.transaction(async (tx: DbTx) => {
		// Paso 1: Crear nuevos equipos en batch
		const missingTeamNames = uniqueTeamNames.filter((n) => !teamNameToId.has(n));

		if (missingTeamNames.length > 0) {
			const inserted = await tx
				.insert(teams)
				.values(missingTeamNames.map((name) => ({ name, leagueId })))
				.returning({ id: teams.id, name: teams.name });

			for (const t of inserted) {
				teamNameToId.set(t.name, t.id);
				created++;
			}
		}

		// Paso 2: Upsert standings snapshot en batch
		const snapshotValues = rows
			.map((r) => {
				const teamId = teamNameToId.get(sanitizeName(r.teamName));
				if (!teamId) return null;
				return {
					teamId,
					leagueId,
					jornada,
					played: r.played,
					wins: r.wins,
					draws: r.draws,
					losses: r.losses,
					goalsFor: r.goalsFor,
					goalsAgainst: r.goalsAgainst,
					points: r.points,
					zone: r.zone ?? null,
					updatedAt: new Date(),
				};
			})
			.filter((v): v is NonNullable<typeof v> => v !== null);

		if (snapshotValues.length > 0) {
			await tx
				.insert(teamStandingsSnapshot)
				.values(snapshotValues)
				.onConflictDoUpdate({
					target: [
						teamStandingsSnapshot.teamId,
						teamStandingsSnapshot.leagueId,
						teamStandingsSnapshot.jornada,
					],
					set: {
						played: teamStandingsSnapshot.played,
						wins: teamStandingsSnapshot.wins,
						draws: teamStandingsSnapshot.draws,
						losses: teamStandingsSnapshot.losses,
						goalsFor: teamStandingsSnapshot.goalsFor,
						goalsAgainst: teamStandingsSnapshot.goalsAgainst,
						points: teamStandingsSnapshot.points,
						zone: teamStandingsSnapshot.zone,
						updatedAt: new Date(),
					},
				});
		}
	});

	return {
		type: "standings",
		upserted: rows.length,
		created,
		warnings: [],
	};
}

// ===========================================================================
// Historia 03 — confirmImportDecisions (nuevo pipeline por capas)
// ===========================================================================

/** Tipo del tx derivado sin importar drizzle directamente. */
type DbTx2 = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Persiste las decisiones del organizador para una importación.
 *
 * Flujo dentro de la transacción:
 *   1. Autos (L1/L2): solo insertar/actualizar season_stats.
 *   2. link_profile: insertar/actualizar season_stats para el perfil elegido.
 *   3. create_new: INSERT player_profile + season_stats.
 *   4. propose_claim: UPDATE player_profile.claimed_player_id + claim_status='proposed'.
 *      → verificar mutual claim: si ≥2 orgs proponen el mismo playerId → promover a 'verified'.
 *   5. ignore: no hacer nada.
 *
 * La transacción hace rollback completo si falla cualquier paso.
 */
export async function confirmImportDecisions(
	input: ConfirmImportInput,
): Promise<ConfirmImportResult> {
	const result: ConfirmImportResult = {
		createdProfiles: 0,
		updatedProfiles: 0,
		claimsProposed: 0,
		claimsAutoVerified: 0,
		errors: [],
	};

	await db.transaction(async (tx: DbTx2) => {
		// ── Paso 1: Procesar autos (L1/L2) ──────────────────────────────────────
		for (const auto of input.autoResolved) {
			try {
				await upsertSeasonStats(tx, {
					profileId: auto.profileId,
					leagueId: input.leagueId,
					row: auto.row,
					jornada: input.jornada,
				});
				result.updatedProfiles++;
			} catch (err) {
				result.errors.push(
					`Auto-resolved "${auto.row.rawFullName}": ${err instanceof Error ? err.message : String(err)}`,
				);
			}
		}

		// ── Paso 2: Procesar decisiones del organizador ──────────────────────────
		for (const decision of input.decisions) {
			const row = input.rowsById.get(decision.rowId);
			if (!row && decision.kind !== "ignore") {
				result.errors.push(`Decision rowId="${decision.rowId}" no encontrado en rowsById`);
				continue;
			}

			try {
				switch (decision.kind) {
					case "link_profile": {
						await upsertSeasonStats(tx, {
							profileId: decision.profileId,
							leagueId: input.leagueId,
							row: row!,
							jornada: input.jornada,
						});
						result.updatedProfiles++;
						break;
					}

					case "create_new": {
						const normalized = normalizePlayerName(decision.fullName);
						const fp = fingerprintPlayer(decision.fullName);

						const [newProfile] = await tx
							.insert(playerProfiles)
							.values({
								organizationId: input.organizationId,
								fullName: decision.fullName,
								alias: decision.alias ?? null,
								normalizedName: normalized,
								fingerprint: fp,
								claimStatus: "unclaimed",
							})
							.onConflictDoUpdate({
								target: [playerProfiles.organizationId, playerProfiles.normalizedName],
								set: { updatedAt: new Date() },
							})
							.returning({ id: playerProfiles.id });

						await upsertSeasonStats(tx, {
							profileId: newProfile.id,
							leagueId: input.leagueId,
							row: row!,
							jornada: input.jornada,
						});
						result.createdProfiles++;
						break;
					}

					case "propose_claim": {
						// Actualizar el profile de esta org con el claim
						const [updatedProfile] = await tx
							.update(playerProfiles)
							.set({
								claimedPlayerId: decision.playerId,
								claimStatus: "proposed",
								updatedAt: new Date(),
							})
							.where(
								and(
									eq(playerProfiles.normalizedName, row!.normalizedName),
									eq(playerProfiles.organizationId, input.organizationId),
								),
							)
							.returning({ id: playerProfiles.id });

						if (updatedProfile) {
							await upsertSeasonStats(tx, {
								profileId: updatedProfile.id,
								leagueId: input.leagueId,
								row: row!,
								jornada: input.jornada,
							});
						}

						result.claimsProposed++;

						// Mutual claim check: si ≥2 orgs distintas proponen este playerId → verified
						const mutualCount = await tx.execute<{ cnt: string }>(
							sql`
                SELECT COUNT(DISTINCT organization_id) AS cnt
                FROM player_profiles
                WHERE claimed_player_id = ${decision.playerId}
                  AND claim_status IN ('proposed', 'verified')
              `,
						);

						const orgCount = Number(mutualCount.rows[0]?.cnt ?? 0);
						if (orgCount >= 2) {
							await tx
								.update(playerProfiles)
								.set({ claimStatus: "verified", updatedAt: new Date() })
								.where(
									and(
										eq(playerProfiles.claimedPlayerId, decision.playerId),
										inArray(playerProfiles.claimStatus, ["proposed", "verified"]),
									),
								);
							result.claimsAutoVerified++;
						}
						break;
					}

					case "ignore":
						break;
				}
			} catch (err) {
				const label = row?.rawFullName ?? decision.rowId;
				result.errors.push(
					`Decision "${decision.kind}" para "${label}": ${err instanceof Error ? err.message : String(err)}`,
				);
			}
		}
	});

	return result;
}

// ---------------------------------------------------------------------------
// Helper: upsert player_season_stats + snapshot
// ---------------------------------------------------------------------------

async function upsertSeasonStats(
	tx: DbTx2,
	opts: {
		profileId: string;
		leagueId: string;
		row: ParsedRow;
		jornada?: number;
	},
): Promise<void> {
	const { profileId, leagueId, row, jornada } = opts;

	// Upsert player_season_stats
	await tx
		.insert(playerSeasonStats)
		.values({
			playerProfileId: profileId,
			leagueId,
			matchesPlayed: row.matchesPlayed,
			goals: row.goals,
			assists: row.assists,
			yellowCards: row.yellowCards,
			redCards: row.redCards,
			jornada: jornada ?? null,
		})
		.onConflictDoUpdate({
			target: [playerSeasonStats.playerProfileId, playerSeasonStats.leagueId],
			set: {
				matchesPlayed: row.matchesPlayed,
				goals: row.goals,
				assists: row.assists,
				yellowCards: row.yellowCards,
				redCards: row.redCards,
				jornada: jornada ?? null,
				updatedAt: new Date(),
			},
		});

	// NOTA: playerSeasonStatsSnapshot.player_id tiene FK a players.id (tabla global legacy),
	// no a player_profiles.id. El nuevo pipeline usa perfiles, por lo que no podemos
	// insertar aquí sin una migración que agregue player_profile_id al snapshot.
	// TODO: agregar columna player_profile_id a player_season_stats_snapshot y migrar.
}
