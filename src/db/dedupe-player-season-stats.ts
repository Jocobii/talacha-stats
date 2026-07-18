/**
 * src/db/dedupe-player-season-stats.ts
 *
 * Limpieza puntual de filas duplicadas en `player_season_stats`.
 *
 * Causa raíz (documentada en src/db/simulator/contributors/aggregates.ts):
 * esa tabla solo tiene UNIQUE sobre (player_profile_id, league_id) — el
 * campo legacy — pero NO sobre (global_player_id, league_id). El
 * contribuidor `aggregates` del Organization Simulator siempre INSERTA
 * (bootstrap-only, nunca upsert), así que correr el simulador o el "avance"
 * más de una vez sobre la misma liga deja varias filas para el mismo
 * jugador con distintos acumulados (una por corrida) en vez de una sola
 * fila actualizada.
 *
 * Esto detectó el bug: la nueva tabla de goleadores paginada (ver
 * ScorersTable.tsx) simplemente pinta lo que hay en la tabla, así que un
 * jugador con 4 filas duplicadas aparece 4 veces con goles distintos.
 *
 * Qué hace este script:
 *   Por cada (global_player_id, league_id) con más de una fila, se queda
 *   con la "ganadora" — mayor `jornada` (nulls al final), desempate por
 *   `updated_at` más reciente — y borra el resto.
 *
 * Uso:
 *   npx tsx src/db/dedupe-player-season-stats.ts --league <leagueId>   dry-run (solo reporta)
 *   npx tsx src/db/dedupe-player-season-stats.ts --league <leagueId> --apply   borra de verdad
 *   npx tsx src/db/dedupe-player-season-stats.ts --apply              TODAS las ligas (usar con cuidado)
 *
 * Mismo anti-foot-gun que seed.ts/simulate.ts: aborta si DATABASE_URL
 * parece apuntar a producción (Supabase).
 */

import { config } from "dotenv";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, inArray } from "drizzle-orm";
import * as schema from "./schema";
import { playerSeasonStats } from "./schema";
import { assertNotProductionDatabase, redactConnectionString } from "./simulator/guards";

config({ path: ".env.local" });
config({ path: ".env" });

// ── CLI args ─────────────────────────────────────────────────────────────────

function readArg(name: string): string | undefined {
	const idx = process.argv.indexOf(`--${name}`);
	if (idx === -1) return undefined;
	return process.argv[idx + 1];
}

const APPLY = process.argv.includes("--apply");
const LEAGUE_ID = readArg("league");

async function main() {
	const url = (process.env.DATABASE_URL ?? "").trim();
	assertNotProductionDatabase(url);

	console.log(`Conectando a ${redactConnectionString(url)}`);
	console.log(
		APPLY ? "Modo: APLICAR (borra de verdad)" : "Modo: DRY RUN (solo reporta, no borra nada)",
	);
	if (LEAGUE_ID) console.log(`Acotado a league_id = ${LEAGUE_ID}`);
	else console.log("⚠️  Sin --league: revisando TODAS las ligas.");

	const pool = new Pool({ connectionString: url });
	const db = drizzle(pool, { schema });

	try {
		const rows = await db
			.select({
				id: playerSeasonStats.id,
				globalPlayerId: playerSeasonStats.globalPlayerId,
				leagueId: playerSeasonStats.leagueId,
				jornada: playerSeasonStats.jornada,
				goals: playerSeasonStats.goals,
				matchesPlayed: playerSeasonStats.matchesPlayed,
				updatedAt: playerSeasonStats.updatedAt,
			})
			.from(playerSeasonStats)
			.where(LEAGUE_ID ? eq(playerSeasonStats.leagueId, LEAGUE_ID) : undefined);

		type Row = (typeof rows)[number];
		const groups = new Map<string, Row[]>();
		for (const r of rows) {
			if (!r.globalPlayerId) continue; // sin global_player_id no podemos agrupar con confianza
			const key = `${r.globalPlayerId}::${r.leagueId}`;
			const list = groups.get(key) ?? [];
			list.push(r);
			groups.set(key, list);
		}

		const idsToDelete: string[] = [];
		let duplicateGroups = 0;

		for (const [key, list] of groups) {
			if (list.length <= 1) continue;
			duplicateGroups++;

			const sorted = [...list].sort((a, b) => {
				const jornadaA = a.jornada ?? -1;
				const jornadaB = b.jornada ?? -1;
				if (jornadaB !== jornadaA) return jornadaB - jornadaA;
				return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
			});

			const [winner, ...losers] = sorted;
			console.log(
				`\n${key} — ${list.length} filas duplicadas. Se queda: ` +
					`goals=${winner!.goals} matchesPlayed=${winner!.matchesPlayed} jornada=${winner!.jornada} (id=${winner!.id})`,
			);
			for (const loser of losers) {
				console.log(
					`  borra: goals=${loser.goals} matchesPlayed=${loser.matchesPlayed} jornada=${loser.jornada} (id=${loser.id})`,
				);
				idsToDelete.push(loser.id);
			}
		}

		console.log(
			`\n${duplicateGroups} jugador(es) con duplicados, ${idsToDelete.length} fila(s) a borrar.`,
		);

		if (!APPLY) {
			console.log("\nDry-run: no se borró nada. Vuelve a correr con --apply para aplicar.");
			return;
		}

		if (idsToDelete.length === 0) {
			console.log("Nada que borrar.");
			return;
		}

		await db.delete(playerSeasonStats).where(inArray(playerSeasonStats.id, idsToDelete));
		console.log(`✅  Borradas ${idsToDelete.length} filas duplicadas.`);
	} finally {
		await pool.end();
	}
}

main().catch((err) => {
	console.error("❌", err instanceof Error ? err.message : err);
	process.exit(1);
});
