/**
 * scripts/backfill-player-profiles.ts
 *
 * Historia 02 — Backfill de player_profiles desde datos legacy.
 *
 * Para cada jugador existente en players que tenga al menos una registration,
 * crea un player_profile en la organización correspondiente y vincula todas
 * sus registrations / season_stats / match_events al nuevo perfil.
 *
 * Diseño:
 *   - Lee jugadores en batches (BATCH_SIZE) para no saturar memoria.
 *   - Cada batch corre en una transacción independiente — si falla un batch
 *     se puede reiniciar sin re-procesar los que ya pasaron (idempotente).
 *   - Si el player_profile ya existe (uq_player_profile_org_name) lo reutiliza.
 *   - Al final imprime un resumen de lo creado / omitido / con error.
 *
 * Ejecutar:
 *   npx tsx scripts/backfill-player-profiles.ts
 *   npx tsx scripts/backfill-player-profiles.ts --dry-run
 */

// ── Env must be loaded BEFORE any @/db import (db/index.ts validates at load time) ──
import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

// ── Static imports that don't trigger env validation ──────────────────────────
import { and, eq, isNull, sql } from "drizzle-orm";
import { normalizePlayerName, fingerprintPlayer } from "../src/shared/lib/normalize.js";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const BATCH_SIZE = 100;
const DRY_RUN = process.argv.includes("--dry-run");

// ---------------------------------------------------------------------------
// Tipos internos
// ---------------------------------------------------------------------------

type Stats = {
	playersScanned: number;
	profilesCreated: number;
	profilesReused: number;
	registrationsLinked: number;
	seasonStatsLinked: number;
	eventsLinked: number;
	errors: string[];
};

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
	// Dynamic import AFTER config() has loaded .env.local
	const { db, players, playerRegistrations, matchEvents, playerSeasonStats, playerProfiles } =
		await import("../src/db/index.js");

	console.log(`\n=== Backfill player_profiles ${DRY_RUN ? "[DRY RUN]" : ""} ===\n`);

	const stats: Stats = {
		playersScanned: 0,
		profilesCreated: 0,
		profilesReused: 0,
		registrationsLinked: 0,
		seasonStatsLinked: 0,
		eventsLinked: 0,
		errors: [],
	};

	// Contar total de jugadores legacy (tienen legacy_player_id en registrations)
	const totalRows = await db.execute<{ total: string }>(
		sql`SELECT COUNT(DISTINCT legacy_player_id) AS total FROM player_registrations WHERE legacy_player_id IS NOT NULL`,
	);
	const total = totalRows.rows[0]?.total ?? "0";
	console.log(`Jugadores a procesar: ${total}\n`);

	let offset = 0;

	while (true) {
		// Obtener batch de player IDs que tienen registrations legacy
		const batchRows = await db.execute<{ id: string }>(
			sql`
        SELECT DISTINCT p.id
        FROM players p
        JOIN player_registrations pr ON pr.legacy_player_id = p.id
        ORDER BY p.id
        LIMIT ${BATCH_SIZE} OFFSET ${offset}
      `,
		);

		const batch = batchRows.rows.map((r) => r.id);
		if (batch.length === 0) break;

		console.log(
			`Procesando batch ${Math.floor(offset / BATCH_SIZE) + 1}: jugadores ${offset + 1}–${offset + batch.length}`,
		);

		for (const playerId of batch) {
			stats.playersScanned++;

			try {
				const player = await db.query.players.findFirst({
					where: eq(players.id, playerId),
					columns: { id: true, fullName: true, alias: true },
				});

				if (!player) {
					stats.errors.push(`Player not found: ${playerId}`);
					continue;
				}

				// Obtener la organización más frecuente para este jugador
				const orgRows = await db.execute<{ organization_id: string; cnt: string }>(
					sql`
            SELECT l.organization_id, COUNT(*) AS cnt
            FROM player_registrations pr
            JOIN leagues l ON l.id = pr.league_id
            WHERE pr.legacy_player_id = ${playerId}
              AND l.organization_id IS NOT NULL
            GROUP BY l.organization_id
            ORDER BY cnt DESC
            LIMIT 1
          `,
				);

				const orgId = orgRows.rows[0]?.organization_id ?? null;
				if (!orgId) continue; // jugador huérfano — sin liga con org

				const normalizedName = normalizePlayerName(player.fullName);
				const fp = fingerprintPlayer(player.fullName);

				if (DRY_RUN) {
					console.log(
						`  [DRY] Would create profile: "${player.fullName}" → org=${orgId} normalized="${normalizedName}"`,
					);
					stats.profilesCreated++;
					continue;
				}

				await db.transaction(async (tx) => {
					// 1. Crear o reutilizar player_profile
					const inserted = await tx
						.insert(playerProfiles)
						.values({
							organizationId: orgId,
							fullName: player.fullName,
							alias: player.alias ?? null,
							normalizedName,
							fingerprint: fp,
							claimedPlayerId: playerId,
							claimStatus: "verified",
						})
						.onConflictDoUpdate({
							target: [playerProfiles.organizationId, playerProfiles.normalizedName],
							set: { updatedAt: new Date() },
						})
						.returning({ id: playerProfiles.id });

					const profileId = inserted[0].id;
					stats.profilesCreated++;

					// 2. Vincular player_registrations
					const regResult = await tx
						.update(playerRegistrations)
						.set({ playerProfileId: profileId })
						.where(
							and(
								eq(playerRegistrations.legacyPlayerId, playerId),
								isNull(playerRegistrations.playerProfileId),
							),
						);
					stats.registrationsLinked += regResult.rowCount ?? 0;

					// 3. Vincular player_season_stats
					const pssResult = await tx
						.update(playerSeasonStats)
						.set({ playerProfileId: profileId })
						.where(
							and(
								eq(playerSeasonStats.legacyPlayerId, playerId),
								isNull(playerSeasonStats.playerProfileId),
							),
						);
					stats.seasonStatsLinked += pssResult.rowCount ?? 0;

					// 4. Vincular match_events
					const evResult = await tx
						.update(matchEvents)
						.set({ playerProfileId: profileId })
						.where(
							and(
								eq(matchEvents.legacyPlayerId, playerId),
								isNull(matchEvents.playerProfileId),
							),
						);
					stats.eventsLinked += evResult.rowCount ?? 0;
				});
			} catch (err) {
				const msg = err instanceof Error ? err.message : String(err);
				stats.errors.push(`Player ${playerId}: ${msg}`);
				console.error(`  ERROR player ${playerId}: ${msg}`);
			}
		}

		offset += batch.length;
		if (batch.length < BATCH_SIZE) break;
	}

	// ---------------------------------------------------------------------------
	// Resumen
	// ---------------------------------------------------------------------------
	console.log(`\n=== Resumen ${DRY_RUN ? "[DRY RUN]" : ""} ===`);
	console.log(`  Jugadores escaneados:      ${stats.playersScanned}`);
	console.log(`  Perfiles creados:          ${stats.profilesCreated}`);
	console.log(`  Perfiles reutilizados:     ${stats.profilesReused}`);
	console.log(`  Registrations vinculadas:  ${stats.registrationsLinked}`);
	console.log(`  Season stats vinculadas:   ${stats.seasonStatsLinked}`);
	console.log(`  Match events vinculados:   ${stats.eventsLinked}`);

	if (stats.errors.length > 0) {
		console.error(`\n  Errores (${stats.errors.length}):`);
		stats.errors.forEach((e) => console.error(`    - ${e}`));
		process.exit(1);
	} else {
		console.log(`\n  Sin errores. ✓`);
	}
}

main().catch((err) => {
	console.error("Fatal error:", err);
	process.exit(1);
});
