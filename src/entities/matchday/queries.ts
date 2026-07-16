/**
 * entities/matchday/queries.ts
 * Acceso de lectura a DB para la entidad Matchday.
 */

import { db } from "@/db";
import { matchdays, matches } from "@/db/schema";
import { eq, and, count, inArray } from "drizzle-orm";
import type { Matchday } from "@/db/schema";
import type { MatchdayPhase, MatchdaySummary, MatchdayPermissionContext } from "./model";

export async function getMatchday(id: string): Promise<Matchday | null> {
	const row = await db.query.matchdays.findFirst({ where: eq(matchdays.id, id) });
	return row ?? null;
}

/**
 * Lo mínimo para resolver `canManageLeague(user, ...)` desde una page — evita
 * que `app/(print)/cedula/jornada/[matchdayId]/page.tsx` arme su propio
 * `db.query.matchdays.findFirst` (§3.3 AGENTS.md: la page llama a entities).
 */
export async function getMatchdayPermissionContext(
	matchdayId: string,
): Promise<MatchdayPermissionContext | null> {
	const row = await db.query.matchdays.findFirst({
		where: eq(matchdays.id, matchdayId),
		columns: { leagueId: true },
		with: { league: { columns: { organizationId: true } } },
	});
	if (!row) return null;
	return { leagueId: row.leagueId, organizationId: row.league?.organizationId ?? null };
}

export async function listMatchdaysByLeague(
	leagueId: string,
	options?: { phase?: MatchdayPhase },
): Promise<MatchdaySummary[]> {
	const whereClause = options?.phase
		? and(eq(matchdays.leagueId, leagueId), eq(matchdays.phase, options.phase))
		: eq(matchdays.leagueId, leagueId);

	const rows = await db.query.matchdays.findMany({
		where: whereClause,
		orderBy: (m, { asc }) => [asc(m.number)],
	});

	if (rows.length === 0) return [];

	const matchdayIds = rows.map((r) => r.id);
	const countRows = await db
		.select({ matchdayId: matches.matchdayId, total: count() })
		.from(matches)
		.where(inArray(matches.matchdayId, matchdayIds))
		.groupBy(matches.matchdayId);

	const countMap = new Map(countRows.map((c) => [c.matchdayId, c.total]));

	return rows.map((row) => ({
		...row,
		matchCount: countMap.get(row.id) ?? 0,
	}));
}
