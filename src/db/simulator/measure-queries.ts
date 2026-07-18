/**
 * src/db/simulator/measure-queries.ts
 *
 * Organization Simulator — Épica D3 (docs/ORGANIZATION-SIMULATOR.md), parte 1:
 * EXPLAIN ANALYZE sobre las lecturas públicas "pesadas" que sí leen la cadena
 * V2 (global_players / league_members / inscriptions) después de migrar
 * entities/player/ranking.ts y entities/organization/queries.ts.
 *
 * Corre contra una DB ya poblada por `pnpm db:simulate -- --tier X` — este
 * script NO genera datos, solo mide.
 *
 * Uso:
 *   pnpm db:measure -- --org <slug>          mide con el slug de una org
 *   pnpm db:measure -- --league <leagueId>   mide con un leagueId específico
 *   pnpm db:measure                          usa la org/liga más reciente
 *
 * Alcance conocido (actualizado julio 2026):
 *   - `/player/[id]` (getPlayerProfile, getPlayerEgoStats en
 *     entities/player/queries.ts) YA está migrado a V2: identidad por
 *     global_players.id, stats vía entities/player/live-stats.ts
 *     (player_season_stats si existe import de Excel, o cálculo en vivo
 *     desde match_player_stats si no). Racha/hat-tricks también migrados
 *     (por jornada si la liga usa scheduling, si no por partido). MVP sigue
 *     en 0 siempre — no se captura en la cédula.
 *   - Pendiente real: `getJornadaHonor` (héroe de jornada, matchday) y
 *     `listTopScorers`/`getPlayerGlobalStats` (vista SQL `player_global_stats`
 *     en src/db/views.sql) siguen 100% en la cadena V1 — no se tocaron en
 *     esta migración. `listTopScorers` requiere una migración de la vista
 *     SQL, no solo cambios de código.
 *   - Las queries medidas aquí SÍ ven datos del simulador: ranking (ciudad/
 *     liga/global), showcase de homepage, snapshot de liga, goleo por
 *     jornada (matchday → getJornadaHonor) y tabla de posiciones en vivo
 *     (Prioridad 2 de getLatestStandings, cálculo desde matches).
 */

import { config } from "dotenv";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";
import * as schema from "../schema";
import { assertNotProductionDatabase, ProductionGuardError } from "./guards";

config({ path: ".env.local" });
config({ path: ".env" });

function readFlag(name: string): string | undefined {
	const args = process.argv.slice(2);
	const idx = args.indexOf(`--${name}`);
	if (idx === -1 || idx === args.length - 1) return undefined;
	return args[idx + 1];
}

const url = (process.env.DATABASE_URL ?? "").trim();

try {
	assertNotProductionDatabase(url);
} catch (err) {
	if (err instanceof ProductionGuardError) {
		console.error(`❌  ${err.message}`);
		process.exit(1);
	}
	throw err;
}

type Target = { orgSlug: string; leagueId: string; leagueName: string; city: string };

async function resolveTarget(db: ReturnType<typeof drizzle>): Promise<Target | null> {
	const orgSlugFlag = readFlag("org");
	const leagueIdFlag = readFlag("league");

	if (leagueIdFlag) {
		const rows = await db.execute(sql`
			SELECT l.id as league_id, l.name as league_name, l.city, o.slug as org_slug
			FROM leagues l LEFT JOIN organizations o ON o.id = l.organization_id
			WHERE l.id = ${leagueIdFlag} LIMIT 1
		`);
		const row = rows.rows[0] as
			| { league_id: string; league_name: string; city: string; org_slug: string | null }
			| undefined;
		if (!row) return null;
		return {
			orgSlug: row.org_slug ?? "",
			leagueId: row.league_id,
			leagueName: row.league_name,
			city: row.city,
		};
	}

	const where = orgSlugFlag ? sql`WHERE o.slug = ${orgSlugFlag}` : sql``;
	const rows = await db.execute(sql`
		SELECT l.id as league_id, l.name as league_name, l.city, o.slug as org_slug
		FROM leagues l LEFT JOIN organizations o ON o.id = l.organization_id
		${where}
		ORDER BY l.created_at DESC
		LIMIT 1
	`);
	const row = rows.rows[0] as
		| { league_id: string; league_name: string; city: string; org_slug: string | null }
		| undefined;
	if (!row) return null;
	return {
		orgSlug: row.org_slug ?? "",
		leagueId: row.league_id,
		leagueName: row.league_name,
		city: row.city,
	};
}

async function explain(
	db: ReturnType<typeof drizzle>,
	label: string,
	query: ReturnType<typeof sql>,
): Promise<void> {
	console.log(`\n──────────────────────────────────────────`);
	console.log(`▶ ${label}`);
	console.log(`──────────────────────────────────────────`);
	try {
		const result = await db.execute(sql`EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT) ${query}`);
		for (const row of result.rows as Record<string, string>[]) {
			console.log(Object.values(row)[0]);
		}
	} catch (err) {
		console.error(`❌  Falló "${label}":`, err instanceof Error ? err.message : err);
	}
}

async function run(): Promise<void> {
	const pool = new Pool({ connectionString: url });
	const db = drizzle(pool, { schema });

	try {
		const target = await resolveTarget(db);
		if (!target) {
			console.error(
				"❌  No encontré ninguna liga. Corre `pnpm db:simulate` primero, o pasa --org/--league.",
			);
			process.exit(1);
		}

		console.log("──────────────────────────────────────────");
		console.log("📊  Organization Simulator — Medición de queries (D3)");
		console.log(`📍  ${url.replace(/:[^:@]+@/, ":***@")}`);
		console.log(`🎯  liga="${target.leagueName}" city="${target.city}" org="${target.orgSlug}"`);
		console.log("──────────────────────────────────────────");

		// 1. Ranking por ciudad — entities/player/ranking.ts::getCityRanking
		await explain(
			db,
			"ranking por ciudad (getCityRanking)",
			sql`
				SELECT pss.global_player_id, gp.full_name, pss.goals, pss.matches_played,
				       pss.league_id, l.name as league_name, pss.team_id, t.name as team_name
				FROM player_season_stats pss
				INNER JOIN global_players gp ON pss.global_player_id = gp.id
				INNER JOIN leagues l ON pss.league_id = l.id
				LEFT JOIN teams t ON pss.team_id = t.id
				LEFT JOIN organizations o ON l.organization_id = o.id
				WHERE l.city = ${target.city}
				  AND pss.goals > 0
				  AND (l.organization_id IS NULL OR o.status = 'verified')
			`,
		);

		// 2. Ranking global — entities/player/ranking.ts::getGlobalRanking
		await explain(
			db,
			"ranking global (getGlobalRanking)",
			sql`
				SELECT pss.global_player_id, gp.full_name, pss.goals, pss.matches_played,
				       pss.league_id, l.name as league_name, t.name as team_name, l.city
				FROM player_season_stats pss
				INNER JOIN global_players gp ON pss.global_player_id = gp.id
				INNER JOIN leagues l ON pss.league_id = l.id
				LEFT JOIN teams t ON pss.team_id = t.id
				LEFT JOIN organizations o ON l.organization_id = o.id
				WHERE pss.goals > 0
				  AND (l.organization_id IS NULL OR o.status = 'verified')
			`,
		);

		// 3. Showcase homepage — entities/organization/queries.ts::getLeaguesShowcase
		await explain(
			db,
			"goleador por liga, showcase homepage (getLeaguesShowcase)",
			sql`
				SELECT pss.league_id, gp.full_name, pss.goals
				FROM player_season_stats pss
				INNER JOIN global_players gp ON pss.global_player_id = gp.id
				WHERE pss.league_id = ${target.leagueId}
				ORDER BY pss.goals DESC, pss.assists DESC
			`,
		);

		// 4. Tabla de posiciones en vivo — entities/organization/queries.ts::getLatestStandings (Prioridad 2)
		await explain(
			db,
			"tabla de posiciones en vivo (getLatestStandings, cálculo desde matches)",
			sql`
				SELECT id, home_team_id, away_team_id, home_score, away_score, status
				FROM matches
				WHERE league_id = ${target.leagueId}
				  AND status IN ('played', 'walkover_home', 'walkover_away', 'completed')
			`,
		);

		// 5. Goleo por jornada — entities/player/ranking.ts::getJornadaHonor (top 3 de la última jornada)
		await explain(
			db,
			"goleo por jornada, top 3 (getJornadaHonor)",
			sql`
				SELECT pss.global_player_id, gp.full_name, pss.goals, pss.matches_played, t.name as team_name
				FROM player_season_stats pss
				INNER JOIN global_players gp ON pss.global_player_id = gp.id
				LEFT JOIN teams t ON pss.team_id = t.id
				WHERE pss.league_id = ${target.leagueId}
				  AND pss.jornada = (
				      SELECT MAX(jornada)::int FROM player_season_stats WHERE league_id = ${target.leagueId}
				  )
				  AND pss.goals > 0
				ORDER BY pss.goals DESC
				LIMIT 3
			`,
		);

		console.log("\n──────────────────────────────────────────");
		console.log(
			'✅  Listo. Revisa "Seq Scan" sobre tablas grandes y "Rows Removed by Filter" alto —',
		);
		console.log("    son las señales típicas de falta de índice a medida que crece el tier.");
	} finally {
		await pool.end();
	}
}

run().catch((err) => {
	console.error("❌  measure-queries falló:", err);
	process.exit(1);
});
