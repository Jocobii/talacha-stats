/**
 * src/db/migrate.ts
 *
 * Corre todas las migraciones pendientes contra la BD.
 * Uso: npm run db:migrate:run
 *
 * Antes de llamar a migrate() de Drizzle, sincroniza automáticamente
 * cualquier migración que ya esté aplicada en la BD pero no registrada
 * en drizzle.__drizzle_migrations (por haber sido aplicada manualmente).
 */

import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import { config } from "dotenv";
import { createHash } from "crypto";
import path from "path";
import fs from "fs";

config({ path: ".env.local" });
config({ path: ".env" });

const url = (process.env.DATABASE_URL ?? "").trim();
if (!url) {
	console.error("❌  DATABASE_URL no definida");
	process.exit(1);
}

const migrationsFolder = path.join(process.cwd(), "src/db/migrations");
const journalPath = path.join(migrationsFolder, "meta/_journal.json");

type JournalEntry = { idx: number; tag: string; when: number };
const journal: { entries: JournalEntry[] } = JSON.parse(
	fs.readFileSync(journalPath, "utf8"),
);

const pool = new Pool({ connectionString: url });
const db = drizzle(pool);

// ── Helpers ───────────────────────────────────────────────────────────────────

function sqlHash(tag: string): string {
	const content = fs.readFileSync(
		path.join(migrationsFolder, `${tag}.sql`),
		"utf8",
	);
	return createHash("sha256").update(content).digest("hex");
}

async function ensureMigrationsTable() {
	await pool.query(`
		CREATE SCHEMA IF NOT EXISTS drizzle;
		CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
			hash       TEXT   NOT NULL,
			created_at BIGINT
		);
	`);
}

async function getRegisteredHashes(): Promise<Set<string>> {
	const { rows } = await pool.query<{ hash: string }>(
		`SELECT hash FROM drizzle.__drizzle_migrations`,
	);
	return new Set(rows.map((r) => r.hash));
}

// ── Backfill automático ───────────────────────────────────────────────────────
// Registra migraciones del journal que ya están en la BD pero que Drizzle
// no tiene anotadas (aplicadas manualmente o desde otra herramienta).

async function syncAppliedMigrations(): Promise<number> {
	await ensureMigrationsTable();
	const registered = await getRegisteredHashes();
	let inserted = 0;

	for (const entry of journal.entries) {
		const hash = sqlHash(entry.tag);
		if (registered.has(hash)) continue;

		// Verificar si el SQL ya fue aplicado comprobando un objeto que crearía.
		// Si falla por "already exists", lo marcamos como aplicado.
		const applied = await isAlreadyApplied(entry.tag);
		if (!applied) continue;

		await pool.query(
			`INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES ($1, $2)`,
			[hash, entry.when],
		);
		inserted++;
	}

	return inserted;
}

// Heurística: intenta correr el SQL en una transacción que siempre hace ROLLBACK.
// Si falla con un error de "ya existe", la migración ya fue aplicada.
async function isAlreadyApplied(tag: string): Promise<boolean> {
	const content = fs.readFileSync(
		path.join(migrationsFolder, `${tag}.sql`),
		"utf8",
	);
	const statements = content
		.split("--> statement-breakpoint")
		.map((s) => s.trim())
		.filter(Boolean);

	const client = await pool.connect();
	try {
		await client.query("BEGIN");
		for (const stmt of statements) {
			await client.query(stmt);
		}
		// Si todo pasó sin error → no estaba aplicada, hacemos ROLLBACK
		// para no duplicar el trabajo de migrate().
		await client.query("ROLLBACK");
		return false;
	} catch (e: unknown) {
		await client.query("ROLLBACK").catch(() => {});
		const msg = (e as Error).message ?? "";
		// Errores típicos cuando algo ya existe
		const alreadyExists =
			msg.includes("already exists") ||
			msg.includes("duplicate") ||
			msg.includes("ya existe");
		return alreadyExists;
	} finally {
		client.release();
	}
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function run() {
	console.log("──────────────────────────────────────────");
	console.log("🗄️  TalachaStats — Migrador de base de datos");
	console.log("──────────────────────────────────────────");
	console.log(`📁  ${migrationsFolder}`);
	console.log("──────────────────────────────────────────");

	// 1. Sincronizar registros de migraciones ya aplicadas manualmente
	console.log("🔄  Sincronizando registros previos…");
	const synced = await syncAppliedMigrations();
	if (synced > 0) {
		console.log(`     ${synced} migración(es) marcada(s) como ya aplicadas.`);
	} else {
		console.log("     Todo sincronizado.");
	}
	console.log("──────────────────────────────────────────");

	// 2. Correr migraciones pendientes normalmente
	console.log("⏳  Aplicando migraciones pendientes…");

	const hashsBefore = await getRegisteredHashes();
	await migrate(db, { migrationsFolder });
	const hashsAfter = await getRegisteredHashes();

	const newCount = hashsAfter.size - hashsBefore.size;

	console.log("──────────────────────────────────────────");
	if (newCount === 0) {
		console.log("ℹ️   Sin migraciones nuevas — la BD ya está al día.");
	} else {
		console.log(`✅  ${newCount} migración(es) nueva(s) aplicada(s).`);
	}
	console.log("──────────────────────────────────────────");
}

run()
	.then(() => pool.end())
	.catch((e) => {
		console.error("──────────────────────────────────────────");
		console.error("❌  Error:", e);
		console.error("──────────────────────────────────────────");
		pool.end();
		process.exit(1);
	});
