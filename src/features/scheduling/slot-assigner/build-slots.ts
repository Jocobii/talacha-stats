/**
 * features/scheduling/slot-assigner/build-slots.ts
 *
 * Capa 2 — Generador de slots disponibles.
 * A partir de una ventana horaria (openTime→closeTime), duración y buffer,
 * produce todos los TimeSlot que caben dentro de esa ventana.
 *
 * Función pura — sin efectos de red ni DB. Testeable en aislamiento.
 *
 * Criterio de aceptación:
 *   ventana 19:40–22:10, duración 50 min, buffer 0 min → 3 slots
 *   19:40–20:30 / 20:30–21:20 / 21:20–22:10
 */

import type { TimeSlot } from "../types";
import type { DayOfWeek } from "@/db/schema";
import { toMinutes, addMinutes } from "../lib/time-overlap";

export type VenueWindow = {
	dayOfWeek: DayOfWeek; // "lunes" | "martes" | … | "domingo"
	openTime: string; // "HH:MM"
	closeTime: string; // "HH:MM"
};

/** Mapeo: nombre español → número JS de día de semana (0 = domingo). */
const SPANISH_TO_JS_DAY: Record<DayOfWeek, number> = {
	domingo: 0,
	lunes: 1,
	martes: 2,
	miercoles: 3,
	jueves: 4,
	viernes: 5,
	sabado: 6,
};

/** Mapeo inverso: número JS de día de semana → nombre español. */
const JS_TO_SPANISH_DAY: Record<number, DayOfWeek> = Object.fromEntries(
	Object.entries(SPANISH_TO_JS_DAY).map(([k, v]) => [v, k]),
) as Record<number, DayOfWeek>;

/** Devuelve el nombre español del día de la semana de una fecha ISO "YYYY-MM-DD". */
export function spanishDayFromIso(isoDate: string): DayOfWeek {
	// 'T00:00' evita desfase de zona horaria en new Date()
	const jsDay = new Date(`${isoDate}T00:00`).getDay();
	return JS_TO_SPANISH_DAY[jsDay]!;
}

/**
 * Genera todos los slots que caben en una ventana horaria dada.
 * El último slot debe terminar a más tardar en `closeTime`.
 */
export function buildSlotsFromWindow(
	venueId: string,
	openTime: string,
	closeTime: string,
	durationMinutes: number,
	bufferMinutes: number,
): TimeSlot[] {
	const closeMin = toMinutes(closeTime);
	const slots: TimeSlot[] = [];
	let current = openTime;

	while (true) {
		const endTime = addMinutes(current, durationMinutes);
		if (toMinutes(endTime) > closeMin) break;

		slots.push({ venueId, startTime: current, endTime });
		current = addMinutes(endTime, bufferMinutes);
	}

	return slots;
}

/**
 * Dado el nombre español de un día ("lunes", "martes", etc.), filtra las ventanas
 * del venue que aplican y retorna todos los slots disponibles.
 */
export function buildSlotsForDay(
	venueId: string,
	windows: VenueWindow[],
	dayOfWeek: DayOfWeek,
	durationMinutes: number,
	bufferMinutes: number,
): TimeSlot[] {
	return windows
		.filter((w) => w.dayOfWeek === dayOfWeek)
		.flatMap((w) =>
			buildSlotsFromWindow(venueId, w.openTime, w.closeTime, durationMinutes, bufferMinutes),
		);
}
