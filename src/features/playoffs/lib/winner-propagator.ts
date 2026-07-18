/**
 * winner-propagator.ts
 *
 * After a playoff match is resolved:
 *  1. Find the playoff_slot for this match.
 *  2. Store winner/loser on the slot.
 *  3. Find downstream slots referencing this one and update their homeTeamId/awayTeamId.
 *  4. If a downstream slot now has both teams and no match yet, create a match record.
 */

import { eq, or, and } from "drizzle-orm";
import { db } from "@/db";
import { playoffSlots, matchdays, matches } from "@/db/schema";

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * `round` es la ronda del playoff_slot del partido resuelto (null si el
 * partido no pertenece a ningún slot, es decir, es un partido regular). El
 * caller (route.ts) lo usa para acotar el "siguiente partido" del flujo de
 * captura a la MISMA ronda — ver getNextScheduledPlayoffMatch en
 * entities/match/queries.ts.
 */
type PropagateResult =
	| { ok: true; propagated: number; round: number | null }
	| { ok: false; reason: string; round: number | null };

// ─── Main export ──────────────────────────────────────────────────────────────

export async function propagatePlayoffWinner(
	resolvedMatchId: string,
	homeScore: number,
	awayScore: number,
): Promise<PropagateResult> {
	// 1. Find the slot for this match
	const slot = await db.query.playoffSlots.findFirst({
		where: eq(playoffSlots.matchId, resolvedMatchId),
		with: {
			bracket: { columns: { id: true, leagueId: true } },
		},
	});

	if (!slot) return { ok: true, propagated: 0, round: null };
	if (!slot.homeTeamId || !slot.awayTeamId) {
		return { ok: false, reason: "Slot has no teams assigned.", round: slot.round };
	}

	// Ties don't auto-propagate — admin must manually edit next slot
	if (homeScore === awayScore) return { ok: true, propagated: 0, round: slot.round };

	const winnerId = homeScore > awayScore ? slot.homeTeamId : slot.awayTeamId;
	const loserId = homeScore > awayScore ? slot.awayTeamId : slot.homeTeamId;

	// 2. Persist winner/loser
	await db.update(playoffSlots).set({ winnerId, loserId }).where(eq(playoffSlots.id, slot.id));

	// 3. Find downstream slots
	const downstream = await db.query.playoffSlots.findMany({
		where: or(eq(playoffSlots.homeFromSlotId, slot.id), eq(playoffSlots.awayFromSlotId, slot.id)),
	});

	if (downstream.length === 0) return { ok: true, propagated: 0, round: slot.round };

	// 4. Get the playoff matchday for this league (for creating new matches)
	const playoffMatchday = await db.query.matchdays.findFirst({
		where: and(eq(matchdays.leagueId, slot.bracket.leagueId), eq(matchdays.phase, "playoff")),
		columns: { id: true },
	});

	const today = new Date().toISOString().slice(0, 10);
	let propagated = 0;

	for (const next of downstream) {
		const updates: Partial<typeof playoffSlots.$inferInsert> = {};

		if (next.homeFromSlotId === slot.id) {
			updates.homeTeamId = next.homeFromType === "winner" ? winnerId : loserId;
		}
		if (next.awayFromSlotId === slot.id) {
			updates.awayTeamId = next.awayFromType === "winner" ? winnerId : loserId;
		}

		await db.update(playoffSlots).set(updates).where(eq(playoffSlots.id, next.id));

		propagated++;

		// After updating, re-read slot to check if both teams are now set
		const refreshed = await db.query.playoffSlots.findFirst({
			where: eq(playoffSlots.id, next.id),
			columns: { id: true, homeTeamId: true, awayTeamId: true, matchId: true },
		});

		if (
			refreshed &&
			refreshed.homeTeamId &&
			refreshed.awayTeamId &&
			!refreshed.matchId &&
			playoffMatchday
		) {
			const [newMatch] = await db
				.insert(matches)
				.values({
					leagueId: slot.bracket.leagueId,
					matchdayId: playoffMatchday.id,
					homeTeamId: refreshed.homeTeamId,
					awayTeamId: refreshed.awayTeamId,
					matchDate: today,
					status: "scheduled",
				})
				.returning({ id: matches.id });

			await db
				.update(playoffSlots)
				.set({ matchId: newMatch.id })
				.where(eq(playoffSlots.id, next.id));
		}
	}

	return { ok: true, propagated, round: slot.round };
}
