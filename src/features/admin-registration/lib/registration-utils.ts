/**
 * features/admin-registration/lib/registration-utils.ts
 * Funciones puras sin ciclo de vida React — fácilmente testeables con Vitest.
 */

import { MONTHS_ES } from "../constants";

export function formatDateEs(isoDate: string): string {
	const [year, month, day] = isoDate.split("-");
	const monthIndex = parseInt(month ?? "1", 10) - 1;
	return `${day} ${MONTHS_ES[monthIndex]} ${year}`;
}

export function getPlayerInitials(fullName: string): string {
	const parts = fullName.trim().split(/\s+/);
	const first = parts[0]?.[0] ?? "";
	const second = parts[1]?.[0] ?? "";
	return (first + second).toUpperCase() || "JG";
}

export function normalizeCurp(raw: string): string {
	return raw.trim().toUpperCase();
}

export function buildDorsalLabel(dorsal: number | null): string {
	return dorsal ? ` · Dorsal ${dorsal}` : "";
}
