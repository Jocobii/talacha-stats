/**
 * features/venue-calendar/lib/date-utils.ts
 * Utilidades de fecha puras para el calendario de canchas.
 */

/** Devuelve una nueva Date desplazada `days` días respecto a `date`. */
export function addDays(date: Date, days: number): Date {
	const result = new Date(date);
	result.setDate(result.getDate() + days);
	return result;
}
