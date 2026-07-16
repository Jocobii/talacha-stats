/**
 * scripts/backfill-credential-code.ts
 *
 * Paso 5 (pendiente) de docs/CREDENCIAL-CODIGO-JUGADOR.md — asigna
 * `credential_code` a los `league_members` que quedaron con NULL porque
 * fueron creados antes de que `assignNextCredential()` entrara en
 * producción (admin-registration, team-management, match-resolution
 * ad-hoc ya lo asignan a los nuevos).
 *
 * Sin este backfill, la cédula imprimible (docs/PLAN-CEDULA-IMPRESA.md)
 * oculta a todo jugador preexistente por decisión de producto (§12.2):
 * "sin credencial → no aparece en la hoja".
 *
 * Diseño:
 *   - Por cada liga, ordena sus `league_members` con `credential_code IS NULL`
 *     por `created_at` (orden de alta real) y les asigna
 *     MAX(credential_code existente en la liga) + 1, 2, 3... — el mismo
 *     esquema "MAX + correlativo" que `assignNextCredential()`.
 *   - Un solo UPDATE con window functions (CTEs), en una transacción —
 *     atómico, sin condiciones de carrera con altas concurrentes durante
 *     la ventana del backfill (se serializa con la misma tabla).
 *   - Idempotente: una vez que ya no quedan `credential_code IS NULL`,
 *     correrlo de nuevo no encuentra filas y no hace nada.
 *
 * Ejecutar:
 *   npx tsx scripts/backfill-credential-code.ts --dry-run
 *   npx tsx scripts/backfill-credential-code.ts
 */

// ── Env must be loaded BEFORE any @/db import (db/index.ts validates at load time) ──
import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

const DRY_RUN = process.argv.includes("--dry-run");

async function main(): Promise<void> {
	// Dynamic import AFTER config() has loaded .env.local
	const { db } = await import("../src/db/index.js");
	const { sql } = await import("drizzle-orm");

	console.log(`\n=== Backfill credential_code ${DRY_RUN ? "[DRY RUN]" : ""} ===\n`);

	const pending = await db.execute<{
		league_id: string;
		league_name: string;
		pending: string;
		next_start: string;
	}>(sql`
		SELECT
			l.id AS league_id,
			l.name AS league_name,
			COUNT(lm.id) AS pending,
			COALESCE(MAX(lm2.credential_code), 0) + 1 AS next_start
		FROM league_members lm
		JOIN leagues l ON l.id = lm.league_id
		LEFT JOIN league_members lm2
			ON lm2.league_id = lm.league_id AND lm2.credential_code IS NOT NULL
		WHERE lm.credential_code IS NULL
		GROUP BY l.id, l.name
		ORDER BY l.name
	`);

	if (pending.rows.length === 0) {
		console.log("Ninguna liga tiene league_members con credential_code NULL. Nada que hacer.\n");
		return;
	}

	console.log(`Ligas con jugadores pendientes de credencial: ${pending.rows.length}\n`);
	let totalPending = 0;
	for (const row of pending.rows) {
		const n = Number(row.pending);
		totalPending += n;
		console.log(
			`  - ${row.league_name} (${row.league_id}): ${n} jugador(es), empieza en ${row.next_start}`,
		);
	}
	console.log(`\nTotal a asignar: ${totalPending}\n`);

	if (DRY_RUN) {
		console.log("--dry-run: no se escribió nada.\n");
		return;
	}

	await db.transaction(async (tx) => {
		await tx.execute(sql`
			WITH ranked AS (
				SELECT
					id,
					league_id,
					ROW_NUMBER() OVER (PARTITION BY league_id ORDER BY created_at, id) AS rn
				FROM league_members
				WHERE credential_code IS NULL
			),
			maxes AS (
				SELECT league_id, COALESCE(MAX(credential_code), 0) AS max_code
				FROM league_members
				GROUP BY league_id
			)
			UPDATE league_members lm
			SET credential_code = maxes.max_code + ranked.rn
			FROM ranked
			JOIN maxes ON maxes.league_id = ranked.league_id
			WHERE lm.id = ranked.id
		`);
	});

	const stillNull = await db.execute<{ total: string }>(
		sql`SELECT COUNT(*) AS total FROM league_members WHERE credential_code IS NULL`,
	);
	const remaining = Number(stillNull.rows[0]?.total ?? 0);

	console.log(`Listo: ${totalPending} credential_code asignados.`);
	if (remaining > 0) {
		console.error(`Advertencia: siguen quedando ${remaining} league_members sin credential_code.`);
	} else {
		console.log("Verificación: 0 league_members con credential_code NULL. ✓\n");
	}
}

main()
	.then(() => process.exit(0))
	.catch((err) => {
		console.error("Fatal error:", err);
		process.exit(1);
	});
