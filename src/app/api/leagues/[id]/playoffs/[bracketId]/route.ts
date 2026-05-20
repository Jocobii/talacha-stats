/**
 * GET /api/leagues/[id]/playoffs/[bracketId]
 * Single bracket with all slots.
 */

import { eq, and } from "drizzle-orm";
import { apiSuccess, apiError } from "@/types";
import { db } from "@/db";
import { playoffBrackets } from "@/db/schema";

type Params = { params: Promise<{ id: string; bracketId: string }> };

export async function GET(_request: Request, { params }: Params) {
	const { id: leagueId, bracketId } = await params;

	const bracket = await db.query.playoffBrackets.findFirst({
		where: and(eq(playoffBrackets.id, bracketId), eq(playoffBrackets.leagueId, leagueId)),
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

	if (!bracket) return apiError("Bracket no encontrado", 404);
	return apiSuccess(bracket);
}
