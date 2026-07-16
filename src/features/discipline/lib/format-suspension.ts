/**
 * features/discipline/lib/format-suspension.ts
 * Formato de fechas/duración para la UI de suspensiones (B7). Pura, sin DB.
 */

const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

/** `endsOn` viene como "YYYY-MM-DD" (columna `date` de Postgres) — parseo manual, sin timezone shifts. */
export function fmtIsoDate(isoDate: string): string {
	const [year, month, day] = isoDate.split("-").map(Number);
	return `${day} ${MONTHS[(month ?? 1) - 1]} ${year}`;
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** Semanas que faltan hasta `endsOn` (fecha de hoy real, no fija como en el mockup). */
export function weeksLeft(endsOnIso: string): number {
	const end = new Date(`${endsOnIso}T00:00:00Z`).getTime();
	const today = new Date();
	const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
	return Math.max(1, Math.ceil((end - todayUtc) / WEEK_MS));
}

export function initialsFromName(fullName: string): string {
	const parts = fullName.trim().split(/\s+/);
	const first = parts[0]?.[0] ?? "";
	const second = parts.length > 1 ? (parts[1]?.[0] ?? "") : "";
	return (first + second).toUpperCase();
}
