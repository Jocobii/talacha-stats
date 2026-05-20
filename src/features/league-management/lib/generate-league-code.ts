/**
 * features/league-management/lib/generate-league-code.ts
 *
 * Genera el código corto de una liga a partir de su nombre.
 * El código se usa como prefijo de las cédulas de partido: "LCN-0001".
 *
 * Algoritmo:
 *   - Sanitiza con sanitizeToCanonical()
 *   - Elimina stop words y palabras de 1 char
 *   - Si quedan 2+ palabras, toma la inicial de cada una (max 4 palabras)
 *   - Si queda 1 palabra, toma los primeros 4 chars
 *   - Resultado en mayúsculas, max 8 chars
 */
import { sanitizeToCanonical } from "@/shared/lib/normalize";

const STOP_WORDS = new Set([
	"liga",
	"futbol",
	"soccer",
	"la",
	"el",
	"los",
	"las",
	"de",
	"del",
	"y",
	"en",
	"fc",
	"club",
]);

export function generateLeagueCode(name: string): string {
	const canonical = sanitizeToCanonical(name);
	const words = canonical.split(/\s+/).filter((w) => w.length > 1 && !STOP_WORDS.has(w));

	if (words.length >= 2) {
		return words
			.slice(0, 4)
			.map((w) => w[0])
			.join("")
			.toUpperCase();
	}

	const base = words[0] ?? canonical;
	return base.substring(0, 4).toUpperCase();
}

/**
 * Resuelve colisiones de código dentro de una organización.
 * Agrega sufijo numérico ("LCN2", "LCN3"...) hasta encontrar uno libre.
 */
export function resolveUniqueCode(base: string, existingCodes: Set<string>): string {
	if (!existingCodes.has(base)) return base;

	let suffix = 2;
	while (existingCodes.has(`${base}${suffix}`)) {
		suffix += 1;
	}
	return `${base}${suffix}`;
}
