/**
 * src/db/simulate.ts
 *
 * Organization Simulator — CLI (Épica D1, docs/ORGANIZATION-SIMULATOR.md).
 * Abre una conexión real a Postgres, arma un SimContext con el tier/semilla
 * pedidos, y corre el pipeline completo (Épicas B+C: identidad, estructura,
 * cascada temporal) dentro de una sola transacción.
 *
 * Uso:
 *   pnpm db:simulate                          tier S, semilla aleatoria, 5 jornadas
 *   pnpm db:simulate -- --tier M --seed 42     tier M, semilla fija (reproducible)
 *   pnpm db:simulate -- --tier XL --jornadas 3
 *
 * Flags:
 *   --tier        S | M | L | XL (default: S)
 *   --seed        entero — misma semilla ⇒ mismo dataset (default: aleatorio)
 *   --jornadas    1-5, cuántas jornadas avanza esta corrida (default: max del tier)
 *
 * Límites conocidos (documentados en los contribuidores, no resueltos aquí):
 *   - Solo corre en modo "bootstrap" (org/liga nueva). Avanzar una liga ya
 *     generada por una corrida anterior requiere precargar ctx.data con lo
 *     existente — eso es trabajo de la Épica E (UI/API), no de este CLI.
 *   - `temporadas: N` (generar varias temporadas de un tirón) no está
 *     implementado — el cierre de temporada/liguilla es una épica futura.
 *
 * Nota de resolución de módulos: este script importa contribuidores que a
 * su vez usan el alias "@/..." (p. ej. "@/db/schema"). tsx (^4) resuelve
 * `paths` de tsconfig.json de forma nativa — si esto falla al correrlo,
 * revisa primero que no sea justamente eso.
 */

import { config } from "dotenv";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";
import { createRng } from "./simulator/rng";
import { createSimContext, SIM_TIERS, type SimTier } from "./simulator/context";
import {
	assertNotProductionDatabase,
	assertReasonableVolume,
	ProductionGuardError,
} from "./simulator/guards";
import {
	runFullBootstrap,
	getOrganizations,
	getGlobalPlayers,
	getLeagues,
	getTeams,
	getVenues,
	getLeagueMembers,
	getInscriptions,
	getMatchdays,
	getMatches,
	getMatchEvents,
	getMatchPlayerStats,
	getTeamStandingsSnapshots,
	getPlayerSeasonStats,
	getSuspensions,
} from "./simulator/contributors";

config({ path: ".env.local" });
config({ path: ".env" });

// ── CLI args ─────────────────────────────────────────────────────────────────

function readFlag(name: string): string | undefined {
	const args = process.argv.slice(2);
	const idx = args.indexOf(`--${name}`);
	if (idx === -1 || idx === args.length - 1) return undefined;
	return args[idx + 1];
}

function parseTier(): SimTier {
	const raw = (readFlag("tier") ?? "S").toUpperCase();
	if (raw !== "S" && raw !== "M" && raw !== "L" && raw !== "XL") {
		console.error(`❌  Tier inválido: "${raw}". Usa uno de: S, M, L, XL.`);
		process.exit(1);
	}
	return raw;
}

function parseSeed(): number {
	const raw = readFlag("seed");
	if (raw === undefined) return Math.floor(Math.random() * 1_000_000);
	const seed = Number(raw);
	if (!Number.isInteger(seed)) {
		console.error(`❌  --seed debe ser un entero. Recibí: "${raw}".`);
		process.exit(1);
	}
	return seed;
}

function parseJornadas(tier: SimTier): number | undefined {
	const raw = readFlag("jornadas");
	if (raw === undefined) return undefined;
	const jornadas = Number(raw);
	const params = SIM_TIERS[tier];
	if (
		!Number.isInteger(jornadas) ||
		jornadas < params.minJornadasPerRun ||
		jornadas > params.maxJornadasPerRun
	) {
		console.error(
			`❌  --jornadas debe ser un entero entre ${params.minJornadasPerRun} y ${params.maxJornadasPerRun}. Recibí: "${raw}".`,
		);
		process.exit(1);
	}
	return jornadas;
}

// ── Guardas ──────────────────────────────────────────────────────────────────

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

// ── Run ──────────────────────────────────────────────────────────────────────

async function run(): Promise<void> {
	const tier = parseTier();
	const seed = parseSeed();
	const jornadasToAdvance = parseJornadas(tier);
	const params = SIM_TIERS[tier];

	assertReasonableVolume({ orgs: params.orgs, leaguesPerOrg: params.leaguesPerOrg });

	console.log("──────────────────────────────────────────");
	console.log("🏟️   Organization Simulator");
	console.log(`📍  ${url.replace(/:[^:@]+@/, ":***@")}`);
	console.log(
		`🎯  tier=${tier}  seed=${seed}  jornadas=${jornadasToAdvance ?? params.maxJornadasPerRun}`,
	);
	console.log("──────────────────────────────────────────");

	const pool = new Pool({ connectionString: url });
	const db = drizzle(pool, { schema });

	try {
		await db.transaction(async (tx) => {
			const rng = createRng(seed);
			const ctx = createSimContext({ rng, seed, tier, db: tx, jornadasToAdvance });

			await runFullBootstrap(ctx);

			console.log(`✓ organizations:            ${getOrganizations(ctx).length}`);
			console.log(`✓ global_players:           ${getGlobalPlayers(ctx).length}`);
			console.log(`✓ leagues:                  ${getLeagues(ctx).length}`);
			console.log(`✓ teams:                    ${getTeams(ctx).length}`);
			console.log(`✓ venues:                   ${getVenues(ctx).length}`);
			console.log(`✓ league_members:           ${getLeagueMembers(ctx).length}`);
			console.log(`✓ inscriptions:             ${getInscriptions(ctx).length}`);
			console.log(`✓ matchdays:                ${getMatchdays(ctx).length}`);
			console.log(`✓ matches:                  ${getMatches(ctx).length}`);
			console.log(`✓ match_events:             ${getMatchEvents(ctx).length}`);
			console.log(`✓ match_player_stats:       ${getMatchPlayerStats(ctx).length}`);
			console.log(`✓ team_standings_snapshot:  ${getTeamStandingsSnapshots(ctx).length}`);
			console.log(`✓ player_season_stats:      ${getPlayerSeasonStats(ctx).length}`);
			console.log(`✓ suspensions:              ${getSuspensions(ctx).length}`);
			console.log("──────────────────────────────────────────");
			console.log(
				`Organización(es): ${getOrganizations(ctx)
					.map((o) => o.slug)
					.join(", ")}`,
			);
			console.log(
				`Liga(s): ${getLeagues(ctx)
					.map((l) => `${l.name} (${l.slug})`)
					.join(", ")}`,
			);
		});
	} finally {
		await pool.end();
	}

	console.log("──────────────────────────────────────────");
	if (tier === "XL") {
		console.log("💾  Tier XL generado — considera respaldar este estado: pnpm db:backup");
	}
	console.log("✅  Listo.");
}

run().catch((err) => {
	console.error("❌  Organization Simulator falló:", err);
	process.exit(1);
});
