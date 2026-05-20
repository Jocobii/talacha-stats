/**
 * features/scheduling/slot-assigner/conflict-detector.ts
 *
 * Capa 2 — Detector de conflictos S7.
 * Un conflicto ocurre cuando dos equipos de un mismo partido han comprado
 * timeslots que se solapan entre sí (impidiendo asignarlos consistentemente).
 *
 * Un PurchasedSlot aplica a TODAS las jornadas de la liga, no es día-específico.
 * El endTime se calcula en el orquestador como startTime + matchDurationMinutes.
 *
 * Función pura — sin efectos de red ni DB.
 */

import type { Pairing, SlotConflict } from "../types";
import { slotsOverlap } from "../lib/time-overlap";

export type PurchasedSlot = {
	teamId: string;
	venueId: string | null; // null = cualquier cancha activa
	startTime: string; // "HH:MM"
	endTime: string; // "HH:MM" — calculado por el orquestador
};

/**
 * Para cada pairing real (sin BYE), detecta si ambos equipos tienen slots
 * comprados que se solapan, lo que genera un conflicto S7 irresolvible.
 */
export function detectPurchasedSlotConflicts(
	pairings: Pairing[],
	purchasedSlots: PurchasedSlot[],
): SlotConflict[] {
	const slotsByTeam = indexSlotsByTeam(purchasedSlots);
	const conflicts: SlotConflict[] = [];

	for (const pairing of pairings) {
		if (pairing.awayTeamId === null) continue; // BYE — ignorar

		const homeSlot = slotsByTeam.get(pairing.homeTeamId);
		const awaySlot = slotsByTeam.get(pairing.awayTeamId);

		if (!homeSlot || !awaySlot) continue;

		if (slotsOverlap(homeSlot.startTime, homeSlot.endTime, awaySlot.startTime, awaySlot.endTime)) {
			conflicts.push({
				pairing,
				teamAId: pairing.homeTeamId,
				teamATime: `${homeSlot.startTime}–${homeSlot.endTime}`,
				teamBId: pairing.awayTeamId,
				teamBTime: `${awaySlot.startTime}–${awaySlot.endTime}`,
				reason: `Los slots comprados por ambos equipos se solapan (${homeSlot.startTime}–${homeSlot.endTime} vs ${awaySlot.startTime}–${awaySlot.endTime})`,
			});
		}
	}

	return conflicts;
}

/** Construye un mapa teamId → PurchasedSlot para búsquedas O(1). */
function indexSlotsByTeam(slots: PurchasedSlot[]): Map<string, PurchasedSlot> {
	const map = new Map<string, PurchasedSlot>();
	for (const slot of slots) {
		map.set(slot.teamId, slot);
	}
	return map;
}
