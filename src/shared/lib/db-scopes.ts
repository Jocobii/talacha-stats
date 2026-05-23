import { eq } from "drizzle-orm";

import { db, leagues } from "@/db";

/**
 * Devuelve los IDs de todas las ligas que pertenecen a una ciudad.
 *
 * Este patron se repite en varias rutas (matches, teams, players) para
 * acotar queries cuando no se recibe un league_id explicito.
 *
 * Uso:
 *   const leagueIds = await getCityLeagueIds(city);
 *   if (leagueIds.length === 0) return apiSuccess([]);
 *   const rows = await db.query.teams.findMany({
 *     where: inArray(teams.leagueId, leagueIds),
 *   });
 */
export async function getCityLeagueIds(city: string): Promise<string[]> {
	const rows = await db.select({ id: leagues.id }).from(leagues).where(eq(leagues.city, city));

	return rows.map((r: { id: string }) => r.id);
}
