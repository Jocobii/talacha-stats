/**
 * features/match-resolution/lib/assign-cedula.ts
 *
 * Asigna la siguiente cédula disponible para un partido dentro de una liga.
 * Debe ejecutarse DENTRO de la transacción del sorteo para que el MAX()
 * refleje los inserts previos de la misma tx (comportamiento garantizado en
 * PostgreSQL con aislamiento READ COMMITTED).
 *
 * Formato: "{LEAGUE_CODE}-{NNNN}"  p.ej. "LCN-0184"
 *
 * Si la liga no tiene código asignado, se genera automáticamente desde el
 * nombre y se persiste en la misma transacción (backfill on-demand).
 */
import { sql, eq } from "drizzle-orm";
import { db } from "@/db";
import { leagues, matches } from "@/db/schema";
import {
	generateLeagueCode,
	resolveUniqueCode,
} from "@/features/league-management/lib/generate-league-code";

type DbTx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export async function assignNextCedula(tx: DbTx, leagueId: string): Promise<string> {
	const league = await tx.query.leagues.findFirst({
		where: eq(leagues.id, leagueId),
		columns: { code: true, name: true },
	});

	if (!league) {
		throw new Error(`Liga ${leagueId} no encontrada`);
	}

	// Auto-asignar código si la liga no lo tiene (backfill on-demand)
	let leagueCode = league.code;
	if (!leagueCode) {
		leagueCode = await assignCodeToLeague(tx, leagueId, league.name);
	}

	const result = await tx.execute(sql`
    SELECT COALESCE(
      MAX(CAST(SUBSTRING(cedula FROM '\\d+$') AS INTEGER)),
      0
    ) AS max_seq
    FROM ${matches}
    WHERE league_id = ${leagueId}
      AND cedula IS NOT NULL
  `);

	const maxSeq = Number((result.rows[0] as Record<string, unknown>)?.max_seq ?? 0);
	const nextSeq = maxSeq + 1;

	return `${leagueCode}-${String(nextSeq).padStart(4, "0")}`;
}

/**
 * Genera un código único para la liga y lo persiste dentro de la transacción.
 * Verifica colisiones contra los códigos existentes en la organización.
 */
async function assignCodeToLeague(tx: DbTx, leagueId: string, name: string): Promise<string> {
	const base = generateLeagueCode(name);

	// Buscar códigos existentes para resolver colisiones
	const existingRows = await tx
		.select({ code: leagues.code })
		.from(leagues)
		.where(sql`${leagues.code} IS NOT NULL`);

	const existingCodes = new Set(existingRows.map((r) => r.code).filter(Boolean) as string[]);
	const code = resolveUniqueCode(base, existingCodes);

	await tx.update(leagues).set({ code }).where(eq(leagues.id, leagueId));

	return code;
}
