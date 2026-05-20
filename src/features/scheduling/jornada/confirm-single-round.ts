/**
 * features/scheduling/jornada/confirm-single-round.ts
 *
 * Persiste los pairings editados de una jornada en DB dentro de una transacción.
 * Borra los matches existentes de la jornada antes de reinsertar (idempotente).
 * Asigna cédula única a cada partido dentro de la transacción.
 */

import { db } from "@/db";
import { matches } from "@/db/schema";
import { eq } from "drizzle-orm";
import { assignNextCedula } from "@/features/match-resolution/lib/assign-cedula";

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

		// Insertar un partido por iteración para que cada llamada a assignNextCedula
		// vea el MAX() actualizado con los inserts previos de la misma transacción.
		// (Si acumuláramos en un array y luego insertáramos en batch, todas las
		// llamadas leerían el mismo MAX() y generarían la misma cédula.)
		for (const p of realPairings) {
			const cedula = await assignNextCedula(tx, leagueId);
			await tx.insert(matches).values({
				leagueId,
				homeTeamId: p.homeTeamId,
				awayTeamId: p.awayTeamId!,
				matchDate: scheduledDate,
				matchdayId,
				venueId: p.venueId ?? null,
				kickoffAt: buildKickoffAt(scheduledDate, p.startTime),
				status: "scheduled" as const,
				cedula,
			});
		}
	});
}

function buildKickoffAt(isoDate: string, time: string | null): Date | null {
	if (!time) return null;
	return new Date(`${isoDate}T${time}:00`);
}
