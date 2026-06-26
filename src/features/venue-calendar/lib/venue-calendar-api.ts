/**
 * features/venue-calendar/lib/venue-calendar-api.ts
 *
 * Transporte del calendario de canchas. Funciones puras sobre `apiFetch` que
 * lanzan `Error(res.error)` en `!ok` (§18.4). Aísla el HTTP del hook → testeable
 * mockeando `@/shared/api/client`.
 *
 * Nota: la LECTURA de eventos la dispara FullCalendar por rango de fechas (su
 * propio motor de fetch/refetch), así que aquí solo exponemos la función; no se
 * envuelve en TanStack Query a propósito (sería un anti-patrón con FC).
 */

import { apiFetch } from "@/shared/api/client";
import { VENUE_EVENTS_URL, VENUE_RENTALS_URL, RENTAL_URL } from "../constants";
import type { VenueEvent, CreateRentalPayload, UpdateRentalPayload } from "../types";

export async function fetchVenueEvents(
	venueId: string,
	range: { start: string; end: string },
): Promise<VenueEvent[]> {
	const result = await apiFetch<VenueEvent[]>(VENUE_EVENTS_URL(venueId, range));
	if (!result.ok) throw new Error(result.error);
	return result.data;
}

export async function createRental(venueId: string, payload: CreateRentalPayload): Promise<void> {
	const result = await apiFetch(VENUE_RENTALS_URL(venueId), {
		method: "POST",
		body: { ...payload },
	});
	if (!result.ok) throw new Error(result.error);
}

export async function updateRental(rentalId: string, payload: UpdateRentalPayload): Promise<void> {
	const result = await apiFetch(RENTAL_URL(rentalId), { method: "PATCH", body: { ...payload } });
	if (!result.ok) throw new Error(result.error);
}

export async function deleteRental(rentalId: string): Promise<void> {
	const result = await apiFetch(RENTAL_URL(rentalId), { method: "DELETE" });
	if (!result.ok) throw new Error(result.error);
}
