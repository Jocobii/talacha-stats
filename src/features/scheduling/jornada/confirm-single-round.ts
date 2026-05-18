/**
 * features/scheduling/jornada/confirm-single-round.ts
 *
 * Persiste los pairings editados de una jornada en DB dentro de una transacción.
 * Borra los matches existentes de la jornada antes de reinsertar (idempotente).
 */

import { db } from "@/db";
import { matches } from "@/db/schema";
import { eq } from "drizzle-orm";

export type ConfirmPairing = {
	homeTeamId: string;
	awayTeamId: string | null;
	venueId: string | null;
	startTime: string | null; // "HH:MM"
};

export type ConfirmSingleRoundInput = {
	matchdayId: string;
	leagueId: string;
	scheduledDate: string; // "YYYY-MM-DD"
	pairings: ConfirmPairing[];
};

export async function confirmSingleRound(input: ConfirmSingleRoundInput): Promise<void> {
	const { matchdayId, leagueId, scheduledDate, pairings } = input;

	await db.transaction(async (tx) => {
		// 1. Borrar matches existentes de esta jornada
		await tx.delete(matches).where(eq(matches.matchdayId, matchdayId));

		// 2. Insertar nuevos matches (BYE = awayTeamId null → no persiste)
		const realPairings = pairings.filter((p) => p.homeTeamId != null && p.awayTeamId != null);

		if (realPairings.length === 0) return;

		await tx.insert(matches).values(
			realPairings.map((p) => ({
				leagueId,
				homeTeamId: p.homeTeamId,
				awayTeamId: p.awayTeamId!,
				matchDate: scheduledDate,
				matchdayId,
				venueId: p.venueId ?? null,
				kickoffAt: buildKickoffAt(scheduledDate, p.startTime),
				status: "scheduled" as const,
			})),
		);
	});
}

function buildKickoffAt(isoDate: string, time: string | null): Date | null {
	if (!time) return null;
	return new Date(`${isoDate}T${time}:00`);
}
