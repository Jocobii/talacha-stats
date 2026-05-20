/**
 * features/scheduling/purchased/update-purchased-slot.ts
 */

import { db } from "@/db";
import { teamPurchasedTimeslots, leagueVenues } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import type { UpdatePurchasedTimeslotInput } from "@/types";
import type { TeamPurchasedTimeslot } from "@/db/schema";

export type UpdatePurchasedSlotResult =
	| { ok: true; slot: TeamPurchasedTimeslot }
	| { ok: false; error: string; status: 400 | 404 };

export async function updatePurchasedSlot(
	id: string,
	input: UpdatePurchasedTimeslotInput,
): Promise<UpdatePurchasedSlotResult> {
	const current = await db.query.teamPurchasedTimeslots.findFirst({
		where: eq(teamPurchasedTimeslots.id, id),
		columns: { id: true, leagueId: true },
	});
	if (!current) return { ok: false, error: "Horario comprado no encontrado", status: 404 };

	if (input.venueId) {
		const assigned = await db.query.leagueVenues.findFirst({
			where: and(
				eq(leagueVenues.leagueId, current.leagueId),
				eq(leagueVenues.venueId, input.venueId),
			),
			columns: { leagueId: true },
		});
		if (!assigned)
			return { ok: false, error: "La cancha no está asignada a esta liga", status: 400 };
	}

	const patch: Partial<TeamPurchasedTimeslot> = {};
	if (input.startTime !== undefined) patch.startTime = input.startTime;
	if (input.venueId !== undefined) patch.venueId = input.venueId;
	if (input.activeFromDate !== undefined) patch.activeFromDate = input.activeFromDate;
	if (input.endMatchdayNumber !== undefined) patch.endMatchdayNumber = input.endMatchdayNumber;
	if (input.notes !== undefined) patch.notes = input.notes;

	const [updated] = await db
		.update(teamPurchasedTimeslots)
		.set(patch)
		.where(eq(teamPurchasedTimeslots.id, id))
		.returning();

	return { ok: true, slot: updated! };
}
