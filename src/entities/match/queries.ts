/**
 * entities/match/queries.ts
 * Acceso de lectura a DB para la entidad Match.
 */

import { db } from "@/db";
import { matches } from "@/db/schema";
import { eq, and, or } from "drizzle-orm";
import type { Match } from "@/db/schema";

const WITH_RELATIONS = {
	matchday: { columns: { id: true, number: true, phase: true, scheduledDate: true } },
	venue: { columns: { id: true, name: true, city: true } },
} as const;

export async function getMatch(id: string): Promise<Match | null> {
	const row = await db.query.matches.findFirst({ where: eq(matches.id, id) });
	return row ?? null;
}

export async function listMatchesByMatchday(matchdayId: string) {
	return db.query.matches.findMany({
		where: eq(matches.matchdayId, matchdayId),
		with: WITH_RELATIONS,
		orderBy: (m, { asc }) => [asc(m.kickoffAt), asc(m.matchDate)],
	});
}

export async function listMatchesByTeamLeague(teamId: string, leagueId: string) {
	return db.query.matches.findMany({
		where: and(
			eq(matches.leagueId, leagueId),
			or(eq(matches.homeTeamId, teamId), eq(matches.awayTeamId, teamId)),
		),
		with: WITH_RELATIONS,
		orderBy: (m, { asc }) => [asc(m.kickoffAt), asc(m.matchDate)],
	});
}
