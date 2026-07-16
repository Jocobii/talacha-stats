/**
 * scripts/backfill-orphan-team-enrollment.ts
 *
 * Fix puntual: equipos generados por el Organization Simulator que se
 * quedaron sin `league_members`/`inscriptions` (roster vacío), a pesar de
 * que la liga y el equipo sí existen y están activos.
 *
 * Causa exacta todavía sin confirmar al 100% (ver conversación con Claude —
 * candidatos: agotamiento del pool de global_players a mitad de una corrida
 * grande, o algún límite de Postgres en un INSERT sin batch dentro del
 * pipeline del simulador). Este script NO corrige la causa raíz — solo
 * repara los datos ya generados para poder seguir probando (asistencias,
 * suspensiones automáticas) sin esperar el fix definitivo.
 *
 * Diseño:
 *   - Solo toca equipos con CERO inscripciones dentro de la liga indicada
 *     (no toca equipos que ya tienen roster, aunque esté incompleto).
 *   - El tamaño de roster a generar por equipo se calcula como la mediana
 *     de roster de los equipos de la MISMA liga que sí tienen jugadores
 *     (fallback: 12 si ningún equipo de la liga tiene roster).
 *   - Genera jugadores nuevos con el mismo generador de identidad sintética
 *     que usa el simulador (mismo formato de CURP hash / nombre canónico),
 *     evitando colisiones contra global_players ya existentes.
 *   - Idempotente: si se corre dos veces, la segunda vez no encuentra
 *     equipos huérfanos y no hace nada.
 *
 * Ejecutar:
 *   npx tsx scripts/backfill-orphan-team-enrollment.ts --league-id=<uuid>
 *   npx tsx scripts/backfill-orphan-team-enrollment.ts --league-id=<uuid> --dry-run
 *   npx tsx scripts/backfill-orphan-team-enrollment.ts --league-id=<uuid> --players-per-team=14
 */

// ── Env must be loaded BEFORE any @/db import (db/index.ts validates at load time) ──
import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

const DRY_RUN = process.argv.includes("--dry-run");

function argValue(name: string): string | undefined {
	const prefix = `--${name}=`;
	const found = process.argv.find((a) => a.startsWith(prefix));
	return found?.slice(prefix.length);
}

async function main(): Promise<void> {
	// Dynamic imports AFTER config() has loaded .env.local, y para poder
	// reusar el guard de producción antes de tocar cualquier tabla.
	const { assertNotProductionDatabase } = await import("../src/db/simulator/guards.js");
	const { env } = await import("../src/shared/env.js");
	assertNotProductionDatabase(env.DATABASE_URL);

	const { db, leagues, teams, leagueMembers, inscriptions, globalPlayers } =
		await import("../src/db/index.js");
	const { eq, sql, inArray } = await import("drizzle-orm");
	const { IdentityGenerator } = await import("../src/db/simulator/identity.js");
	const { createRng } = await import("../src/db/simulator/rng.js");
	const { insertInBatches } = await import("../src/db/simulator/chunk.js");

	const leagueId = argValue("league-id");
	if (!leagueId) {
		console.error("Falta --league-id=<uuid>. Ejemplo:");
		console.error(
			"  npx tsx scripts/backfill-orphan-team-enrollment.ts --league-id=c95ecafd-b6ef-49e8-b03e-8dff8598cabd",
		);
		process.exit(1);
	}

	const league = await db.query.leagues.findFirst({ where: eq(leagues.id, leagueId) });
	if (!league) {
		console.error(`No existe ninguna liga con id ${leagueId}`);
		process.exit(1);
	}

	// Equipos de la liga + cuántas inscripciones tiene cada uno.
	const rosterCounts = await db
		.select({
			teamId: teams.id,
			teamName: teams.name,
			rosterSize: sql<number>`count(${inscriptions.id})`.mapWith(Number),
		})
		.from(teams)
		.leftJoin(inscriptions, eq(inscriptions.teamId, teams.id))
		.where(eq(teams.leagueId, leagueId))
		.groupBy(teams.id, teams.name);

	const orphanTeams = rosterCounts.filter((t) => t.rosterSize === 0);
	const healthyRosterSizes = rosterCounts.filter((t) => t.rosterSize > 0).map((t) => t.rosterSize);

	if (orphanTeams.length === 0) {
		console.log(`Liga "${league.name}" (${leagueId}): ningún equipo huérfano. Nada que hacer.`);
		return;
	}

	const overridePlayersPerTeam = argValue("players-per-team");
	const playersPerTeam = overridePlayersPerTeam
		? Number(overridePlayersPerTeam)
		: (median(healthyRosterSizes) ?? 12);

	console.log(`Liga "${league.name}" (${leagueId})`);
	console.log(`Equipos totales: ${rosterCounts.length} — huérfanos: ${orphanTeams.length}`);
	console.log(`Jugadores por equipo a generar: ${playersPerTeam}`);
	console.log(orphanTeams.map((t) => `  - ${t.teamName} (${t.teamId})`).join("\n"));

	if (DRY_RUN) {
		console.log("\n--dry-run: no se escribió nada.");
		return;
	}

	const slotsNeeded = orphanTeams.length * playersPerTeam;

	const existingKeys = await db
		.select({
			fullNameCanonical: globalPlayers.fullNameCanonical,
			curpHash: globalPlayers.curpHash,
		})
		.from(globalPlayers);

	const rng = createRng(Math.floor(Math.random() * 1_000_000));
	const generator = new IdentityGenerator(rng);
	generator.seedExisting(existingKeys);
	const identities = generator.nextN(slotsNeeded);

	const playerRows = await insertInBatches(
		identities.map((i) => ({
			curpHash: i.curpHash,
			fullName: i.fullName,
			fullNameCanonical: i.fullNameCanonical,
			birthDate: i.birthDate,
		})),
		(batch) => db.insert(globalPlayers).values(batch).returning(),
	);

	const inscriptionDate = new Date().toISOString().slice(0, 10);
	let cursor = 0;
	const memberDefs: {
		globalPlayerId: string;
		leagueId: string;
		dorsal: number;
		inscriptionDate: string;
	}[] = [];
	const teamIdByIndex: string[] = [];

	for (const team of orphanTeams) {
		for (let i = 0; i < playersPerTeam; i++) {
			const player = playerRows[cursor++];
			memberDefs.push({
				globalPlayerId: player.id,
				leagueId,
				dorsal: i + 1,
				inscriptionDate,
			});
			teamIdByIndex.push(team.teamId);
		}
	}

	const memberRows = await insertInBatches(memberDefs, (batch) =>
		db.insert(leagueMembers).values(batch).returning(),
	);

	const inscriptionDefs = memberRows.map((member, i) => ({
		leagueMemberId: member.id,
		teamId: teamIdByIndex[i],
	}));

	await insertInBatches(inscriptionDefs, (batch) =>
		db.insert(inscriptions).values(batch).returning(),
	);

	console.log(
		`\nListo: ${memberRows.length} jugadores inscritos en ${orphanTeams.length} equipos huérfanos.`,
	);

	// Verificación: re-contar para confirmar que ya no quedan huérfanos.
	const stillOrphan = await db
		.select({
			teamId: teams.id,
			rosterSize: sql<number>`count(${inscriptions.id})`.mapWith(Number),
		})
		.from(teams)
		.leftJoin(inscriptions, eq(inscriptions.teamId, teams.id))
		.where(
			inArray(
				teams.id,
				orphanTeams.map((t) => t.teamId),
			),
		)
		.groupBy(teams.id)
		.having(sql`count(${inscriptions.id}) = 0`);

	if (stillOrphan.length > 0) {
		console.error(`Advertencia: ${stillOrphan.length} equipos siguen sin roster tras el backfill.`);
	}
}

function median(nums: number[]): number | undefined {
	if (nums.length === 0) return undefined;
	const sorted = [...nums].sort((a, b) => a - b);
	const mid = Math.floor(sorted.length / 2);
	return sorted.length % 2 === 0 ? Math.round((sorted[mid - 1] + sorted[mid]) / 2) : sorted[mid];
}

main()
	.then(() => process.exit(0))
	.catch((err) => {
		console.error(err);
		process.exit(1);
	});
