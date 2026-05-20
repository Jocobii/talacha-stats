/**
 * features/scheduling/slot-assigner/assign-slots.ts
 *
 * Capa 2 — Orquestador del slot assigner.
 * Recibe los matchdays generados por la Capa 1 + datos de canchas + slots comprados
 * y devuelve el GeneratedSchedule completo (assigned + conflicts + unassigned).
 *
 * Supuesto de MVP: una jornada por semana, la primera el día de `startDate`,
 * las siguientes cada 7 días.
 *
 * Función pura — sin efectos de red ni DB.
 */

import type { GeneratedMatchday, AssignedMatch, SlotConflict, Pairing } from "../types";
import { buildSlotsForDay, spanishDayFromIso, type VenueWindow } from "./build-slots";
import { detectPurchasedSlotConflicts, type PurchasedSlot } from "./conflict-detector";
import { assignGreedy } from "./assign-greedy";
import { addMinutes } from "../lib/time-overlap";

export type VenueWithWindows = {
	venueId: string;
	priority: number; // menor = se llena primero
	windows: VenueWindow[];
};

export type AssignSlotsInput = {
	matchdays: GeneratedMatchday[];
	startDate: string; // "YYYY-MM-DD" de la jornada 1
	durationMinutes: number;
	bufferMinutes: number;
	venues: VenueWithWindows[];
	purchasedSlots: PurchasedSlot[];
};

export type AssignSlotsResult = {
	assigned: AssignedMatch[];
	conflicts: SlotConflict[];
	unassigned: Pairing[];
};

export function assignSlots(input: AssignSlotsInput): AssignSlotsResult {
	const { matchdays, startDate, durationMinutes, bufferMinutes, venues, purchasedSlots } = input;

	const allAssigned: AssignedMatch[] = [];
	const allConflicts: SlotConflict[] = [];
	const allUnassigned: Pairing[] = [];

	const sortedVenues = [...venues].sort((a, b) => a.priority - b.priority);

	// Slots comprados con endTime calculado
	const purchasedWithEnd = enrichPurchasedSlots(purchasedSlots, durationMinutes);

	for (const matchday of matchdays) {
		const matchDate = matchdayDate(startDate, matchday.number);
		const dayOfWeek = spanishDayFromIso(matchDate);

		// Detectar conflictos S7 para esta jornada
		const conflicts = detectPurchasedSlotConflicts(matchday.pairings, purchasedWithEnd);
		allConflicts.push(...conflicts);

		// Generar slots disponibles por venue (respetando prioridad)
		const availableSlots = sortedVenues.flatMap((v) =>
			buildSlotsForDay(v.venueId, v.windows, dayOfWeek, durationMinutes, bufferMinutes),
		);

		const { assigned, unassigned } = assignGreedy({
			matchdayNumber: matchday.number,
			pairings: matchday.pairings,
			availableSlots,
			purchasedSlots: purchasedWithEnd,
		});

		allAssigned.push(...assigned);
		allUnassigned.push(...unassigned);
	}

	return { assigned: allAssigned, conflicts: allConflicts, unassigned: allUnassigned };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Calcula la fecha de una jornada: jornada 1 = startDate, cada siguiente +7 días. */
function matchdayDate(startDate: string, matchdayNumber: number): string {
	const date = new Date(`${startDate}T00:00`);
	date.setDate(date.getDate() + (matchdayNumber - 1) * 7);
	return date.toISOString().slice(0, 10);
}

/** Agrega endTime a cada PurchasedSlot calculándolo desde startTime + duración. */
function enrichPurchasedSlots(slots: PurchasedSlot[], durationMinutes: number): PurchasedSlot[] {
	return slots.map((s) => ({
		...s,
		endTime: addMinutes(s.startTime, durationMinutes),
	}));
}
