/**
 * src/db/migrate-to-global-players.ts
 *
 * Migración de datos: players → global_players
 *
 * Por cada registro en `players`, inserta una fila en `global_players` con un
 * dummy curp_hash = sha256("PENDING_" + player.id). El oficinista lo regulariza
 * cuando el jugador regresa a ventanilla con su INE.
 *
 * IDEMPOTENTE: si el hash dummy ya existe en global_players, lo omite.
 * Seguro de correr múltiples veces.
 *
 * Uso:
 *   npx tsx src/db/migrate-to-global-players.ts
 */

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { config } from "dotenv";
import { createHash } from "crypto";
import { players, globalPlayers } from "./schema";

config({ path: ".env.local" });
config({ path: ".env" });

const url = (process.env.DATABASE_URL ?? "").trim();
if (!url) {
	console.error("❌  DATABASE_URL no definida");
	process.exit(1);
}

const pool = new Pool({ connectionString: url });
const db = drizzle(pool, { schema: { players, globalPlayers } });

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Genera el dummy hash para un jugador legacy. */
function dummyHash(playerId: string): string {
	return createHash("sha256").update(`PENDING_${playerId}`).digest("hex");
}

/** Fecha de nacimiento por defecto para jugadores sin birth_date en el sistema legacy. */
const FALLBACK_BIRTH_DATE = "1990-01-01";

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function run() {
	console.log("──────────────────────────────────────────────────");
	console.log("🔄  Migración: players → global_players");
	console.log("──────────────────────────────────────────────────");

	// 1. Leer todos los jugadores legacy
	const legacyPlayers = await db.select().from(players);
	console.log(`📋  Jugadores en tabla legacy: ${legacyPlayers.length}`);

	// 2. Leer hashes ya registrados para idempotencia
	const existingRows = await db.select({ curpHash: globalPlayers.curpHash }).from(globalPlayers);
	const existingHashes = new Set(existingRows.map((r) => r.curpHash));
	console.log(`✅  Ya migrados: ${existingHashes.size}`);

	// 3. Filtrar los que faltan
	const pending = legacyPlayers.filter((p) => !existingHashes.has(dummyHash(p.id)));
	console.log(`⏳  Pendientes: ${pending.length}`);
	console.log("──────────────────────────────────────────────────");

	if (pending.length === 0) {
		console.log("ℹ️   Sin jugadores nuevos — migración ya completa.");
		return;
	}

	// 4. Insertar en lotes de 50 para no saturar la conexión
	const BATCH_SIZE = 50;
	let inserted = 0;
	let skipped = 0;

	for (let i = 0; i < pending.length; i += BATCH_SIZE) {
		const batch = pending.slice(i, i + BATCH_SIZE);

		const values = batch.map((p) => ({
			curpHash: dummyHash(p.id),
			fullName: p.fullName,
			// players legacy no tiene birth_date — usamos fallback
			birthDate: FALLBACK_BIRTH_DATE,
			avatarUrl: p.photoUrl ?? null,
		}));

		try {
			await db.insert(globalPlayers).values(values).onConflictDoNothing(); // idempotencia extra por si acaso

			inserted += batch.length;
			process.stdout.write(`\r   Progreso: ${inserted + skipped}/${pending.length}`);
		} catch (err) {
			console.error(`\n❌  Error en lote ${i / BATCH_SIZE + 1}:`, err);
			skipped += batch.length;
		}
	}

	console.log("\n──────────────────────────────────────────────────");
	console.log(`✅  Insertados: ${inserted}`);
	if (skipped > 0) console.log(`⚠️   Omitidos por error: ${skipped}`);
	console.log("──────────────────────────────────────────────────");
	console.log('💡  Dummy hash format: sha256("PENDING_" + player.id)');
	console.log("   Se regulariza cuando el jugador presenta su INE.");
	console.log("──────────────────────────────────────────────────");
}

run()
	.then(() => pool.end())
	.catch((e) => {
		console.error("❌  Error fatal:", e);
		pool.end();
		process.exit(1);
	});
