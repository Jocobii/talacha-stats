/**
 * GET /api/leagues/[id]/playoffs
 *
 * Returns all playoff brackets for a league, each with its slots fully populated
 * (team names, round, slotIndex, winner, etc.).
 */

import { eq } from "drizzle-orm";
import { apiSuccess, apiError } from "@/types";
import { db } from "@/db";
import { leagues, playoffBrackets } from "@/db/schema";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
	const { id: leagueId } = await params;

	const league = await db.query.leagues.findFirst({
		where: eq(leagues.id, leagueId),
		columns: { id: true },
	});
	if (!league) return apiError("Liga no encontrada", 404);

	const brackets = await db.query.playoffBrackets.findMany({
		where: eq(playoffBrackets.leagueId, leagueId),
		orderBy: (b, { asc }) => [asc(b.createdAt)],
		with: {
			slots: {
				orderBy: (s, { asc }) => [asc(s.round), asc(s.slotIndex)],
				with: {
					homeTeam: { columns: { id: true, name: true } },
					awayTeam: { columns: { id: true, name: true } },
					winner: { columns: { id: true, name: true } },
					loser: { columns: { id: true, name: true } },
				},
			},
		},
	});

	return apiSuccess(brackets);
}
