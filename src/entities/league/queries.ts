/**
 * entities/league/queries.ts
 * Acceso a DB para ligas. Server-only — no re-exportar desde index.ts hacia
 * el bundle cliente (regla del split barrel entity, ver AGENTS.md §3).
 */

import { asc, eq } from "drizzle-orm";
import { db, leagues } from "@/db";

export type LeagueOption = { id: string; name: string };

/**
 * Ligas de una organización, para poblar selects (ej. filtro "Liga" en
 * /admin/players). Solo id + name — el resto de campos no aplica a un
 * control de FilterBar.
 */
export async function listOrgLeagueOptions(organizationId: string): Promise<LeagueOption[]> {
	const rows = await db.query.leagues.findMany({
		where: eq(leagues.organizationId, organizationId),
		orderBy: [asc(leagues.name)],
		columns: { id: true, name: true },
	});
	return rows;
}
