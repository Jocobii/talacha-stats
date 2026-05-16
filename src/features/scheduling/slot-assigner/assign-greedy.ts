/**
 * features/scheduling/slot-assigner/assign-greedy.ts
 *
 * Capa 2 — Asignador greedy de slots.
 *
 * Prioridad de asignación por partido (jornada):
 *   1. Slot comprado por el equipo local (si libre en esa jornada)
 *   2. Slot comprado por el equipo visitante (si libre en esa jornada)
 *   3. Primer slot disponible en la lista de slots del día
 *
 * Un slot está "ocupado" si ya fue asignado a otro partido en la misma jornada.
 * Los partidos BYE (awayTeamId === null) nunca reciben slot.
 *
 * Función pura — sin efectos de red ni DB.
 */

import type { Pairing, AssignedMatch, TimeSlot } from "../types";
import type { PurchasedSlot } from "./conflict-detector";

export type AssignGreedyInput = {
	matchdayNumber: number;
	pairings: Pairing[];
	availableSlots: TimeSlot[]; // slots generados por build-slots para el día
	purchasedSlots: PurchasedSlot[];
};

export type AssignGreedyResult = {
	assigned: AssignedMatch[];
	unassigned: Pairing[];
};

export function assignGreedy(input: AssignGreedyInput): AssignGreedyResult {
	const { matchdayNumber, pairings, availableSlots, purchasedSlots } = input;

	const slotsByTeam = buildTeamSlotMap(purchasedSlots);
	const usedSlotKeys = new Set<string>(); // "venueId::startTime"

	const assigned: AssignedMatch[] = [];
	const unassigned: Pairing[] = [];

	for (const pairing of pairings) {
		if (pairing.awayTeamId === null) continue; // BYE — no slot needed

		const slot = resolveSlot(pairing, slotsByTeam, availableSlots, usedSlotKeys);
		if (!slot) {
			unassigned.push(pairing);
			continue;
		}

		usedSlotKeys.add(slotKey(slot));
		assigned.push({ pairing, slot, matchdayNumber });
	}

	return { assigned, unassigned };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Construye mapa teamId → TimeSlot para slots comprados (venueId null → no cancha fija). */
function buildTeamSlotMap(purchased: PurchasedSlot[]): Map<string, TimeSlot> {
	const map = new Map<string, TimeSlot>();
	for (const ps of purchased) {
		map.set(ps.teamId, {
			venueId: ps.venueId ?? "",
			startTime: ps.startTime,
			endTime: ps.endTime,
		});
	}
	return map;
}

/**
 * Resuelve el slot para un pairing siguiendo la cadena de prioridad:
 * slot comprado por home → slot comprado por away → primer slot libre.
 */
function resolveSlot(
	pairing: Pairing,
	slotsByTeam: Map<string, TimeSlot>,
	available: TimeSlot[],
	used: Set<string>,
): TimeSlot | null {
	const homePreferred = slotsByTeam.get(pairing.homeTeamId);
	if (homePreferred?.venueId && !used.has(slotKey(homePreferred))) return homePreferred;

	const awayPreferred = pairing.awayTeamId ? slotsByTeam.get(pairing.awayTeamId) : undefined;
	if (awayPreferred?.venueId && !used.has(slotKey(awayPreferred))) return awayPreferred;

	return available.find((s) => !used.has(slotKey(s))) ?? null;
}

function slotKey(slot: TimeSlot): string {
	return `${slot.venueId}::${slot.startTime}`;
}
