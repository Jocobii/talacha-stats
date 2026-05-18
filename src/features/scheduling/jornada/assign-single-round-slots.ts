/**
 * features/scheduling/jornada/assign-single-round-slots.ts
 *
 * Asigna cancha+hora a los pairings de una sola jornada.
 * Reutiliza build-slots y assign-greedy. Función pura — sin DB.
 */

import {
	buildSlotsForDay,
	spanishDayFromIso,
	type VenueWindow,
} from "@/features/scheduling/slot-assigner/build-slots";
import { assignGreedy } from "@/features/scheduling/slot-assigner/assign-greedy";
import { addMinutes } from "@/features/scheduling/lib/time-overlap";
import type { PurchasedSlot } from "@/features/scheduling/slot-assigner/conflict-detector";
import type { Pairing } from "@/features/scheduling/types";
import type { DayOfWeek } from "@/db/schema";

export type VenueWithWindows = {
	venueId: string;
	priority: number;
	windows: VenueWindow[];
};

export type AssignedPairing = {
	homeTeamId: string;
	awayTeamId: string | null;
	venueId: string | null;
	startTime: string | null;
};

export type AssignSingleRoundSlotsInput = {
	pairings: Pairing[];
	scheduledDate: string; // "YYYY-MM-DD"
	durationMinutes: number;
	bufferMinutes: number;
	venues: VenueWithWindows[];
	purchasedSlots: PurchasedSlot[];
};

export function assignSingleRoundSlots(input: AssignSingleRoundSlotsInput): AssignedPairing[] {
	const { pairings, scheduledDate, durationMinutes, bufferMinutes, venues, purchasedSlots } = input;

	const dayOfWeek = spanishDayFromIso(scheduledDate) as DayOfWeek;
	const sortedVenues = [...venues].sort((a, b) => a.priority - b.priority);

	const purchasedWithEnd = purchasedSlots.map((s) => ({
		...s,
		endTime: addMinutes(s.startTime, durationMinutes),
	}));

	const availableSlots = sortedVenues.flatMap((v) =>
		buildSlotsForDay(v.venueId, v.windows, dayOfWeek, durationMinutes, bufferMinutes),
	);

	const { assigned, unassigned } = assignGreedy({
		matchdayNumber: 1, // dummy — no se usa en la lógica greedy
		pairings,
		availableSlots,
		purchasedSlots: purchasedWithEnd,
	});

	const assignedMap = new Map<string, { venueId: string; startTime: string }>();
	for (const a of assigned) {
		const key = matchKey(a.pairing.homeTeamId, a.pairing.awayTeamId ?? "BYE");
		assignedMap.set(key, { venueId: a.slot.venueId, startTime: a.slot.startTime });
	}

	void unassigned; // pairings sin slot quedan con null — no es un error

	return pairings.map((p) => {
		const key = matchKey(p.homeTeamId, p.awayTeamId ?? "BYE");
		const slot = assignedMap.get(key) ?? null;
		return {
			homeTeamId: p.homeTeamId,
			awayTeamId: p.awayTeamId,
			venueId: slot?.venueId ?? null,
			startTime: slot?.startTime ?? null,
		};
	});
}

function matchKey(homeId: string, awayId: string): string {
	return `${homeId}::${awayId}`;
}
