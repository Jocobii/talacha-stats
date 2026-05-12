/**
 * shared/lib/normalize.ts
 *
 * Utilidades de normalización de texto — convención global de TalachaStats.
 *
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  CONVENCIÓN: campos de texto ingresados por humanos                     │
 * │                                                                         │
 * │  Almacenamiento en BD  → sanitizeName()  (lowercase + trim + spaces)   │
 * │  Display en UI         → titleCase()     (primera letra por palabra)   │
 * │  Búsqueda / matching   → f_unaccent() + similarity() en PostgreSQL     │
 * │                                                                         │
 * │  APLICA a:   full_name, alias, teams.name, leagues.name, users.name    │
 * │  NO aplica:  enums (dayOfWeek, status, role), city, season, email,     │
 * │              UUIDs, timestamps, números                                 │
 * │                                                                         │
 * │  Toda tabla nueva con campos de texto buscables debe seguir esta regla. │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * Estas funciones son síncronas y no dependen de la BD. Se pueden usar tanto
 * en el servidor como en el cliente.
 *
 * Funciones para identidad en dos capas (Historia 02):
 *   normalizePlayerName()  → clave de búsqueda exacta intra-org
 *   fingerprintPlayer()    → clave compuesta para deduplicación intra-org
 */

// ---------------------------------------------------------------------------
// Partículas que NO se capitalizan salvo que sean la primera palabra
// Cubre los apellidos y nombres compuestos más comunes en México
// ---------------------------------------------------------------------------
const PARTICLES = new Set([
	"de",
	"la",
	"el",
	"del",
	"los",
	"las",
	"y",
	"e",
	"o",
	"a",
	"por",
	"en",
	"con",
]);

// ---------------------------------------------------------------------------
// sanitizeName
// Limpia un nombre crudo que viene del Excel:
//   - Elimina espacios al inicio/fin
//   - Colapsa múltiples espacios en uno
//   - Convierte a lowercase
//   - Elimina caracteres no imprimibles (tabs, newlines, etc.)
//
// Uso: aplicar SIEMPRE antes de insertar un nombre en la BD y antes
// de usarlo como clave de búsqueda.
// ---------------------------------------------------------------------------
export function sanitizeName(raw: string): string {
	return raw
		.trim()
		.replace(/[\t\r\n]+/g, " ") // tabs / saltos de línea → espacio
		.replace(/\s{2,}/g, " ") // múltiples espacios → uno
		.toLowerCase();
}

// ---------------------------------------------------------------------------
// titleCase
// Convierte un nombre en lowercase almacenado para mostrarlo en la UI:
//   "juan de la cruz"  → "Juan de la Cruz"
//   "jose garcia"      → "Jose Garcia"
//   "del valle"        → "Del Valle"
//
// La primera palabra siempre se capitaliza independientemente de si es
// partícula, para cubrir apellidos que empiezan con "De", "Del", etc.
// ---------------------------------------------------------------------------
export function titleCase(str: string): string {
	if (!str) return str;
	return str
		.split(" ")
		.map((word, i) => {
			if (!word) return word;
			if (i > 0 && PARTICLES.has(word)) return word; // partícula en medio → lowercase
			return word.charAt(0).toUpperCase() + word.slice(1); // primera letra upper
		})
		.join(" ");
}

// ---------------------------------------------------------------------------
// normalizePlayerName (Historia 02)
// Produce la clave normalizada que se almacena en player_profiles.normalized_name
// y que se usa para el matching exacto intra-org (L1/L2).
//
// Diferencias vs sanitizeName:
//   - Elimina acentos (á→a, é→e, etc.) en JS, sin depender de f_unaccent de PG
//   - Colapsa sufijos generacionales: JR, JR., SR, SR., II, III, IV, HIJO, HIJA
//
// Invariante: normalizePlayerName(x) === normalizePlayerName(sanitizeName(x))
// para cualquier string x. Es idempotente.
// ---------------------------------------------------------------------------
const GENERATIONAL_SUFFIXES = /\s+\b(jr\.?|sr\.?|ii|iii|iv|v|hijo|hija)\b\.?$/i;

export function normalizePlayerName(input: string): string {
	return (
		input
			.trim()
			.toLowerCase()
			// Colapsa espacios múltiples
			.replace(/\s{2,}/g, " ")
			// Elimina tabs/newlines
			.replace(/[\t\r\n]+/g, " ")
			// Quita sufijos generacionales (al final del string)
			.replace(GENERATIONAL_SUFFIXES, "")
			// Normaliza acentos: descompone en NFD y elimina diacríticos (U+0300-U+036F)
			.normalize("NFD")
			.replace(/[̀-ͯ]/g, "")
			.trim()
	);
}

// ---------------------------------------------------------------------------
// fingerprintPlayer (Historia 02)
// Clave compuesta usada para deduplicación intra-org durante el backfill.
// Combina normalized_name con el número de dorsal si está disponible.
//
// Formato: "<normalized_name>" o "<normalized_name>::<jersey>"
//
// El dorsal es opcional — muchos imports legacy no lo tienen. Cuando no se
// provee, el fingerprint es solo el nombre normalizado.
// ---------------------------------------------------------------------------
export function fingerprintPlayer(fullName: string, jersey?: string | number | null): string {
	const base = normalizePlayerName(fullName);
	if (jersey == null || jersey === "") return base;
	return `${base}::${String(jersey).trim()}`;
}
