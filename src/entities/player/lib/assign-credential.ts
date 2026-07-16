/**
 * entities/player/lib/assign-credential.ts
 *
 * Asigna el siguiente credential_code para un league_member dentro de una
 * liga. Espejo directo de
 * features/match-resolution/lib/assign-cedula.ts.
 *
 * Debe ejecutarse DENTRO de la transacción que inserta el league_member,
 * para que el MAX() refleje los inserts previos de la misma tx
 * (comportamiento garantizado en PostgreSQL con aislamiento READ COMMITTED).
 *
 * Vive en entities/player (no en un feature) porque varios features
 * distintos crean league_members (admin-registration, team-management,
 * match-resolution) y todos necesitan la misma garantía de unicidad.
 * NO se re-exporta desde el barrel de la entidad (index.ts) — igual que
 * queries.ts, importa "@/db" y romper esa regla filtraría código de
 * servidor al bundle de cliente. Importar siempre con la ruta completa:
 * "@/entities/player/lib/assign-credential".
 *
 * Reglas invariantes (ver docs/CREDENCIAL-CODIGO-JUGADOR.md §3):
 * - Único por liga: UNIQUE(league_id, credential_code) en DB es la red de
 *   seguridad ante carreras.
 * - Inmutable: una vez asignado no se edita.
 * - No se reutiliza: siempre MAX + 1, aunque haya códigos "quemados" por
 *   miembros inactivos.
 * - Se guarda el entero crudo; el relleno de ceros es solo presentación
 *   (ver entities/player/lib/credential.ts).
 */
import { sql } from "drizzle-orm";
import { db } from "@/db";

type DbTx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Asigna el siguiente credential_code para una liga.
 * MAX(credential_code) + 1 dentro de la MISMA transacción que crea el
 * league_member. Serializa por liga con un advisory lock para evitar que
 * dos altas concurrentes calculen el mismo MAX antes de insertar.
 */
export async function assignNextCredential(tx: DbTx, leagueId: string): Promise<number> {
	// Serializa por liga para evitar dos altas simultáneas con el mismo número.
	await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${"cred:" + leagueId}))`);

	const result = await tx.execute(sql`
    SELECT COALESCE(MAX(credential_code), 0) AS max_code
    FROM league_members
    WHERE league_id = ${leagueId}
  `);

	const maxCode = Number((result.rows[0] as Record<string, unknown>)?.max_code ?? 0);

	return maxCode + 1;
}
