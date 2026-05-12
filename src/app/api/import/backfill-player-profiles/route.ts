import { db, playerProfiles, playerRegistrations, playerSeasonStats, matchEvents } from "@/db";
import { eq, sql } from "drizzle-orm";
import { apiSuccess, apiError } from "@/types";
import { normalizePlayerName, fingerprintPlayer } from "@/shared/lib/normalize";

/**
 * POST /api/import/backfill-player-profiles
 *
 * Completa la migración de Historia 02: crea un player_profile por cada
 * jugador existente (players) dentro de cada organización en la que
 * aparece, luego actualiza player_profile_id en las tres tablas legacy:
 *   - player_registrations
 *   - player_season_stats
 *   - match_events
 *
 * Idempotente — usa ON CONFLICT DO NOTHING / DO UPDATE seguro.
 * Seguro de correr varias veces: solo procesa filas donde player_profile_id IS NULL.
 */
export async function POST() {
	try {
		const result = await db.transaction(async (tx) => {
			// ── Paso 1: registrations legacy sin perfil ──────────────────────────
			// Carga todas las registraciones que tienen legacy_player_id pero no player_profile_id,
			// junto con el player (nombre/alias) y la org de la liga.
			const legacyRegs = await tx.execute<{
				reg_id: string;
				legacy_player_id: string;
				league_id: string;
				organization_id: string;
				full_name: string;
				alias: string | null;
			}>(sql`
				SELECT
					pr.id                AS reg_id,
					pr.legacy_player_id  AS legacy_player_id,
					pr.league_id         AS league_id,
					l.organization_id    AS organization_id,
					p.full_name          AS full_name,
					p.alias              AS alias
				FROM player_registrations pr
				JOIN leagues l  ON l.id = pr.league_id
				JOIN players p  ON p.id = pr.legacy_player_id
				WHERE pr.legacy_player_id IS NOT NULL
				  AND pr.player_profile_id IS NULL
				  AND l.organization_id IS NOT NULL
			`);

			if (legacyRegs.rows.length === 0) {
				return { profilesCreated: 0, regsUpdated: 0, statsUpdated: 0, eventsUpdated: 0 };
			}

			// ── Paso 2: deduplicar por (legacy_player_id, organization_id) ───────
			// Un jugador puede estar en varias ligas de la misma org → un solo perfil.
			const profileMap = new Map<
				string, // key: `${legacyPlayerId}::${organizationId}`
				{ legacyPlayerId: string; organizationId: string; fullName: string; alias: string | null }
			>();

			for (const row of legacyRegs.rows) {
				const key = `${row.legacy_player_id}::${row.organization_id}`;
				if (!profileMap.has(key)) {
					profileMap.set(key, {
						legacyPlayerId: row.legacy_player_id,
						organizationId: row.organization_id,
						fullName: row.full_name,
						alias: row.alias,
					});
				}
			}

			// ── Paso 3: upsert player_profiles ───────────────────────────────────
			// claim_status = 'verified' porque venimos de la tabla global players.
			const profileIdMap = new Map<string, string>(); // key → profileId

			let profilesCreated = 0;
			for (const [key, data] of profileMap) {
				const normalized = normalizePlayerName(data.fullName);
				const fp = fingerprintPlayer(data.fullName);

				const [profile] = await tx
					.insert(playerProfiles)
					.values({
						organizationId: data.organizationId,
						fullName: data.fullName,
						alias: data.alias,
						normalizedName: normalized,
						fingerprint: fp,
						claimedPlayerId: data.legacyPlayerId,
						claimStatus: "verified",
					})
					.onConflictDoUpdate({
						target: [playerProfiles.organizationId, playerProfiles.normalizedName],
						// Si ya existe (de importaciones previas con el pipeline nuevo),
						// solo actualiza el claim — no sobreescribir fullName/alias.
						set: {
							claimedPlayerId: data.legacyPlayerId,
							claimStatus: "verified",
							updatedAt: new Date(),
						},
					})
					.returning({ id: playerProfiles.id });

				profileIdMap.set(key, profile.id);
				profilesCreated++;
			}

			// ── Paso 4: actualizar player_registrations ───────────────────────────
			let regsUpdated = 0;
			for (const row of legacyRegs.rows) {
				const key = `${row.legacy_player_id}::${row.organization_id}`;
				const profileId = profileIdMap.get(key);
				if (!profileId) continue;

				await tx
					.update(playerRegistrations)
					.set({ playerProfileId: profileId })
					.where(eq(playerRegistrations.id, row.reg_id));
				regsUpdated++;
			}

			// ── Paso 5: actualizar player_season_stats ────────────────────────────
			// Misma lógica: legacy_player_id IS NOT NULL AND player_profile_id IS NULL
			const legacyStats = await tx.execute<{
				stat_id: string;
				legacy_player_id: string;
				organization_id: string;
			}>(sql`
				SELECT
					pss.id               AS stat_id,
					pss.legacy_player_id AS legacy_player_id,
					l.organization_id    AS organization_id
				FROM player_season_stats pss
				JOIN leagues l ON l.id = pss.league_id
				WHERE pss.legacy_player_id IS NOT NULL
				  AND pss.player_profile_id IS NULL
				  AND l.organization_id IS NOT NULL
			`);

			let statsUpdated = 0;
			for (const row of legacyStats.rows) {
				const key = `${row.legacy_player_id}::${row.organization_id}`;
				const profileId = profileIdMap.get(key);
				// Si el perfil no estaba en el map (ya tenía player_profile_id en registrations),
				// lo buscamos en la DB por org + legacy link.
				const resolvedProfileId =
					profileId ?? (await resolveProfileId(tx, row.legacy_player_id, row.organization_id));
				if (!resolvedProfileId) continue;

				await tx
					.update(playerSeasonStats)
					.set({ playerProfileId: resolvedProfileId })
					.where(eq(playerSeasonStats.id, row.stat_id));
				statsUpdated++;
			}

			// ── Paso 6: actualizar match_events ───────────────────────────────────
			const legacyEvents = await tx.execute<{
				event_id: string;
				legacy_player_id: string;
				organization_id: string;
			}>(sql`
				SELECT
					me.id                AS event_id,
					me.legacy_player_id  AS legacy_player_id,
					l.organization_id    AS organization_id
				FROM match_events me
				JOIN matches m ON m.id = me.match_id
				JOIN leagues l ON l.id = m.league_id
				WHERE me.legacy_player_id IS NOT NULL
				  AND me.player_profile_id IS NULL
				  AND l.organization_id IS NOT NULL
			`);

			let eventsUpdated = 0;
			for (const row of legacyEvents.rows) {
				const key = `${row.legacy_player_id}::${row.organization_id}`;
				const profileId = profileIdMap.get(key);
				const resolvedProfileId =
					profileId ?? (await resolveProfileId(tx, row.legacy_player_id, row.organization_id));
				if (!resolvedProfileId) continue;

				await tx
					.update(matchEvents)
					.set({ playerProfileId: resolvedProfileId })
					.where(eq(matchEvents.id, row.event_id));
				eventsUpdated++;
			}

			return { profilesCreated, regsUpdated, statsUpdated, eventsUpdated };
		});

		return apiSuccess({
			...result,
			message: [
				`${result.profilesCreated} perfiles creados/actualizados`,
				`${result.regsUpdated} registraciones vinculadas`,
				`${result.statsUpdated} estadísticas vinculadas`,
				`${result.eventsUpdated} eventos vinculados`,
			].join(" · "),
		});
	} catch (e) {
		return apiError(e instanceof Error ? e.message : "Error en backfill", 500);
	}
}

// ---------------------------------------------------------------------------
// Helper: busca en la DB el player_profile de un player legacy en una org.
// Usado para filas de stats/events cuya registration ya fue migrada antes.
// ---------------------------------------------------------------------------
type TxType = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function resolveProfileId(
	tx: TxType,
	legacyPlayerId: string,
	organizationId: string,
): Promise<string | null> {
	const result = await tx.execute<{ id: string }>(sql`
		SELECT id FROM player_profiles
		WHERE organization_id = ${organizationId}
		  AND claimed_player_id = ${legacyPlayerId}
		LIMIT 1
	`);
	return result.rows[0]?.id ?? null;
}
