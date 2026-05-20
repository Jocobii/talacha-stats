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

/**
 * Extrae la fecha de nacimiento de una CURP válida de 18 caracteres.
 * Posiciones 4-9 contienen AAMMDD.
 * El siglo se determina por el carácter en posición 16:
 *   dígito (0-9) → nacido en 1900s
 *   letra  (A-Z) → nacido en 2000s
 * Retorna "YYYY-MM-DD" o null si la CURP es inválida / fecha imposible.
 */
/**
 * Extrae la fecha de nacimiento de una CURP válida de 18 caracteres.
 * Posiciones 4-9 contienen AAMMDD.
 *
 * Determinación del siglo:
 *   Si YY <= año actual (2 dígitos) → siglo XXI (20YY)
 *   Si YY >  año actual (2 dígitos) → siglo XX  (19YY)
 *
 * Ej: YY=01, año actual=26 → 01 ≤ 26 → 2001
 *     YY=85, año actual=26 → 85 > 26 → 1985
 *
 * Retorna "YYYY-MM-DD" o null si la fecha es imposible.
 */
export function birthDateFromCurp(curp: string): string | null {
	if (curp.length !== 18) return null;

	const yy = curp.slice(4, 6);
	const mm = curp.slice(6, 8);
	const dd = curp.slice(8, 10);

	if (!/^\d{2}$/.test(yy) || !/^\d{2}$/.test(mm) || !/^\d{2}$/.test(dd)) return null;

	const currentYY = new Date().getFullYear() % 100;
	const century = parseInt(yy, 10) <= currentYY ? "20" : "19";
	const isoDate = `${century}${yy}-${mm}-${dd}`;

	// Validar que la fecha sea real (ej. no mes 13 ni día 32)
	const date = new Date(isoDate);
	const valid =
		!isNaN(date.getTime()) &&
		date.getUTCMonth() + 1 === parseInt(mm, 10) &&
		date.getUTCDate() === parseInt(dd, 10);

	return valid ? isoDate : null;
}

export function buildDorsalLabel(dorsal: number | null): string {
	return dorsal ? ` · Dorsal ${dorsal}` : "";
}
