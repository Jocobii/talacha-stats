/**
 * src/db/backfill-single-league-credentials.ts
 *
 * Backfill: crea pases `single_league` retroactivos para los league_members
 * existentes de ligas `active` que todavía no tienen credential_id
 * (docs/CREDENCIAL-PASE-JUGADOR.md §8).
 *
 * Por cada league_member sin pase, en una liga `active` y cuya liga tenga
 * organización asignada:
 *   1. Inserta un player_credentials (scope='single_league', status='active',
 *      league_id = la liga del miembro, organization_id = la org de la liga).
 *   2. Actualiza ese league_member.credential_id al pase recién creado.
 *
 * Los league_members de ligas `finished` se dejan sin pase (histórico — no
 * afecta validaciones futuras, §8 punto 2). No se infieren pases
 * `organization`: el anual es una decisión de negocio/pago, no se adivina
 * del histórico (§8 punto 3).
 *
 * IDEMPOTENTE: solo procesa league_members con credential_id IS NULL — una
 * corrida ya completa no vuelve a tocar nada.
 *
 * Uso:
 *   npx tsx src/db/backfill-single-league-credentials.ts
 */

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { config } from "dotenv";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { leagues, leagueMembers, playerCredentials } from "./schema";

config({ path: ".env.local" });
config({ path: ".env" });

const url = (process.env.DATABASE_URL ?? "").trim();
if (!url) {
	console.error("❌  DATABASE_URL no definida");
	process.exit(1);
}

const pool = new Pool({ connectionString: url });
const db = drizzle(pool);

const BATCH_SIZE = 50;

async function run() {
	console.log("──────────────────────────────────────────────────────");
	console.log("🔄  Backfill: pases single_league retroactivos");
	console.log("──────────────────────────────────────────────────────");

	// 1. Ligas activas con organización asignada — sin org no hay dónde
	//    anclar el pase (player_credentials.organization_id es NOT NULL).
	const activeLeagues = await db
		.select({ id: leagues.id, organizationId: leagues.organizationId })
		.from(leagues)
		.where(eq(leagues.status, "active"));

	const orgByLeagueId = new Map(
		activeLeagues.filter((l) => l.organizationId).map((l) => [l.id, l.organizationId as string]),
	);
	const leaguesWithoutOrg = activeLeagues.length - orgByLeagueId.size;
	console.log(`📦  Ligas activas: ${activeLeagues.length} (sin org: ${leaguesWithoutOrg})`);

	if (orgByLeagueId.size === 0) {
		console.log("ℹ️   Ninguna liga activa con organización — nada que hacer.");
		return;
	}

	// 2. league_members sin pase, de esas ligas.
	const pending = await db
		.select({
			id: leagueMembers.id,
			leagueId: leagueMembers.leagueId,
			globalPlayerId: leagueMembers.globalPlayerId,
		})
		.from(leagueMembers)
		.where(
			and(
				isNull(leagueMembers.credentialId),
				inArray(leagueMembers.leagueId, Array.from(orgByLeagueId.keys())),
			),
		);

	console.log(`⏳  Por respaldar: ${pending.length}`);
	if (pending.length === 0) {
		console.log("ℹ️   Sin league_members pendientes — backfill ya completo.");
		return;
	}

	// 3. Por cada uno: crear el pase y enlazarlo, en lotes.
	let done = 0;
	let errors = 0;

	for (let i = 0; i < pending.length; i += BATCH_SIZE) {
		const batch = pending.slice(i, i + BATCH_SIZE);

		await Promise.all(
			batch.map(async (member) => {
				const organizationId = orgByLeagueId.get(member.leagueId);
				if (!organizationId) return; // no debería pasar — ya filtrado arriba

				try {
					const [credential] = await db
						.insert(playerCredentials)
						.values({
							globalPlayerId: member.globalPlayerId,
							organizationId,
							scope: "single_league",
							leagueId: member.leagueId,
							status: "active",
						})
						.returning({ id: playerCredentials.id });

					if (!credential) throw new Error("insert sin retorno");

					await db
						.update(leagueMembers)
						.set({ credentialId: credential.id })
						.where(eq(leagueMembers.id, member.id));

					done++;
				} catch (err) {
					console.error(`\n❌  Error en league_member ${member.id}:`, err);
					errors++;
				}
			}),
		);

		process.stdout.write(`\r   Progreso: ${done + errors}/${pending.length}`);
	}

	console.log("\n──────────────────────────────────────────────────────");
	console.log(`✅  Pases creados: ${done}`);
	if (errors > 0) console.log(`❌  Errores:      ${errors}`);
	console.log("──────────────────────────────────────────────────────");
}

run()
	.then(() => pool.end())
	.catch((e) => {
		console.error("❌  Error fatal:", e);
		pool.end();
		process.exit(1);
	});
