/**
 * features/scheduling/purchased/create-purchased-slot.ts
 * Registra que un equipo compró un horario fijo para la temporada (S7).
 * Un equipo solo puede tener un slot comprado activo por liga.
 */

import { db } from "@/db";
import { teamPurchasedTimeslots, teams, leagueVenues } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import type { CreatePurchasedTimeslotInput } from "@/types";
import type { TeamPurchasedTimeslot } from "@/db/schema";

export type CreatePurchasedSlotResult =
	| { ok: true; slot: TeamPurchasedTimeslot }
	| { ok: false; error: string; status: 400 | 404 | 409 };

export async function createPurchasedSlot(
	input: CreatePurchasedTimeslotInput,
): Promise<CreatePurchasedSlotResult> {
	const team = await db.query.teams.findFirst({
		where: and(eq(teams.id, input.teamId), eq(teams.leagueId, input.leagueId)),
		columns: { id: true },
	});
	if (!team) return { ok: false, error: "El equipo no pertenece a esta liga", status: 404 };

	if (input.venueId) {
		const venueAssigned = await db.query.leagueVenues.findFirst({
			where: and(
				eq(leagueVenues.leagueId, input.leagueId),
				eq(leagueVenues.venueId, input.venueId),
			),
			columns: { leagueId: true },
		});
		if (!venueAssigned)
			return { ok: false, error: "La cancha no está asignada a esta liga", status: 400 };
	}

	const existing = await db.query.teamPurchasedTimeslots.findFirst({
		where: and(
			eq(teamPurchasedTimeslots.teamId, input.teamId),
			eq(teamPurchasedTimeslots.leagueId, input.leagueId),
		),
		columns: { id: true },
	});
	if (existing)
		return {
			ok: false,
			error:
				"El equipo ya tiene un horario comprado en esta liga. Edítalo en lugar de crear uno nuevo.",
			status: 409,
		};

	const [slot] = await db
		.insert(teamPurchasedTimeslots)
		.values({
			teamId: input.teamId,
			leagueId: input.leagueId,
			startTime: input.startTime,
			venueId: input.venueId ?? null,
			activeFromDate: input.activeFromDate,
			endMatchdayNumber: input.endMatchdayNumber ?? null,
			notes: input.notes ?? null,
		})
		.returning();

	return { ok: true, slot: slot! };
}
