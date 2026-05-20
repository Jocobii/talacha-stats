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

	// Procesar primero los partidos donde algún equipo tiene slot comprado,
	// para garantizar que su horario no sea tomado por otro partido.
	// Los BYEs (awayTeamId === null) se procesan al final — solo para mostrar
	// la hora comprada del equipo como referencia si la tienen.
	const hasPurchased = (p: Pairing) =>
		slotsByTeam.has(p.homeTeamId) || (!!p.awayTeamId && slotsByTeam.has(p.awayTeamId));
	const sorted = [
		...pairings.filter((p) => p.awayTeamId !== null && hasPurchased(p)),
		...pairings.filter((p) => p.awayTeamId !== null && !hasPurchased(p)),
		...pairings.filter((p) => p.awayTeamId === null), // BYEs al final
	];

	for (const pairing of sorted) {
		// BYE: no consume slot real, pero muestra la hora comprada como referencia
		if (pairing.awayTeamId === null) {
			const ps = slotsByTeam.get(pairing.homeTeamId);
			if (ps) {
				const refSlot: import("../types").TimeSlot = {
					venueId: ps.venueId ?? "",
					startTime: ps.startTime,
					endTime: ps.endTime ?? "",
				};
				assigned.push({ pairing, slot: refSlot, matchdayNumber });
			}
			continue;
		}

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

/** Construye mapa teamId → PurchasedSlot para slots comprados. */
function buildTeamSlotMap(purchased: PurchasedSlot[]): Map<string, PurchasedSlot> {
	const map = new Map<string, PurchasedSlot>();
	for (const ps of purchased) map.set(ps.teamId, ps);
	return map;
}

/**
 * Intenta usar un slot comprado:
 * - Con cancha específica: busca ese slot exacto en `available` y que no esté ocupado.
 * - Sin cancha (venueId null): busca cualquier slot a esa hora en cualquier venue libre.
 *
 * Devuelve el TimeSlot a usar, o null si no se puede honrar el slot comprado.
 */
function tryPurchasedSlot(
	ps: PurchasedSlot | undefined,
	available: TimeSlot[],
	used: Set<string>,
): TimeSlot | null {
	if (!ps) return null;

	if (ps.venueId) {
		// Cancha fija: el slot exacto debe estar disponible
		const exact: TimeSlot = {
			venueId: ps.venueId,
			startTime: ps.startTime,
			endTime: ps.endTime ?? "",
		};
		return !used.has(slotKey(exact)) ? exact : null;
	} else {
		// Sin cancha fija: cualquier venue que tenga slot a esa hora y esté libre
		return available.find((s) => s.startTime === ps.startTime && !used.has(slotKey(s))) ?? null;
	}
}

/**
 * Resuelve el slot para un pairing siguiendo la cadena de prioridad:
 * slot comprado por home → slot comprado por away → primer slot libre.
 */
function resolveSlot(
	pairing: Pairing,
	slotsByTeam: Map<string, PurchasedSlot>,
	available: TimeSlot[],
	used: Set<string>,
): TimeSlot | null {
	const homeSlot = tryPurchasedSlot(slotsByTeam.get(pairing.homeTeamId), available, used);
	if (homeSlot) return homeSlot;

	const awaySlot = pairing.awayTeamId
		? tryPurchasedSlot(slotsByTeam.get(pairing.awayTeamId), available, used)
		: null;
	if (awaySlot) return awaySlot;

	return available.find((s) => !used.has(slotKey(s))) ?? null;
}

function slotKey(slot: TimeSlot): string {
	return `${slot.venueId}::${slot.startTime}`;
}
