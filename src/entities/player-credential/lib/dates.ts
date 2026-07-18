/**
 * entities/player-credential/lib/dates.ts
 * Utilidades de fecha puras para el pase — sin imports de `@/db`.
 */

/** Hoy en formato YYYY-MM-DD, mismo formato que las columnas `date` de Drizzle. */
export function todayIsoDate(): string {
	return new Date().toISOString().slice(0, 10);
}

/** Suma `years` años a una fecha ISO (YYYY-MM-DD), preservando el formato. */
export function addYearsIso(dateIso: string, years: number): string {
	const date = new Date(`${dateIso}T00:00:00.000Z`);
	date.setUTCFullYear(date.getUTCFullYear() + years);
	return date.toISOString().slice(0, 10);
}

/** Días entre `today` y `dateIso` (positivo si `dateIso` es futuro). */
export function daysUntil(dateIso: string, today: string): number {
	const target = new Date(`${dateIso}T00:00:00.000Z`).getTime();
	const from = new Date(`${today}T00:00:00.000Z`).getTime();
	return Math.round((target - from) / (1000 * 60 * 60 * 24));
}
