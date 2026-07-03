/**
 * features/tournament-skin/lib/today-iso.ts
 *
 * "Hoy" como "YYYY-MM-DD" en la zona horaria de negocio (Tijuana). El server
 * puede correr en UTC; sin esto un torneo arrancaría/terminaría hasta 7 horas
 * antes de lo esperado. `en-CA` formatea exactamente como ISO date.
 */

import { SKIN_TIMEZONE } from "../constants";

export function todayIso(now: Date = new Date()): string {
	return new Intl.DateTimeFormat("en-CA", {
		timeZone: SKIN_TIMEZONE,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).format(now);
}
