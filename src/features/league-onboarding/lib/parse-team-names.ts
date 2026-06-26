/**
 * features/league-onboarding/lib/parse-team-names.ts
 *
 * Parseo "perdonador" de nombres de equipo para el alta rápida de liga (A2).
 *
 * El organizador no técnico pega su lista en cualquier formato (comas,
 * saltos de línea, lista numerada, viñetas). Esta capa la convierte en
 * nombres limpios, recortados y deduplicados por FORMA CANÓNICA — la misma
 * que usa la DB (sanitizeToCanonical), para que el dedup del cliente y el
 * del servidor coincidan exactamente y nunca entre basura.
 *
 * Funciones puras y sin estado → unit-testeables.
 */

import { sanitizeToCanonical } from "@/shared/lib/normalize";

export const MAX_TEAM_NAME_LENGTH = 80;
export const MAX_TEAMS = 50;

/** Numeración o viñeta al inicio: "1.", "2)", "3 -", "- ", "• ", "* " */
const LIST_MARKER = /^\s*(?:\d+\s*[.)\-–]\s*|[-*•·]\s+)/;
/** Separadores entre equipos al pegar una lista. */
const SEPARATORS = /[\n\r,;\t]+/;

/** Limpia un nombre suelto: recorta, colapsa espacios, quita viñeta/numeración y comillas. */
export function cleanTeamName(raw: string): string {
	let s = (raw ?? "").replace(/\s+/g, " ").trim();
	s = s.replace(LIST_MARKER, "").trim();
	s = s.replace(/^["'«»“”]+|["'«»“”]+$/g, "").trim();
	return s;
}

/** Separa texto crudo en candidatos por saltos de línea, comas, ; o tabs. */
export function splitTeamInput(raw: string): string[] {
	if (!raw) return [];
	return raw
		.split(SEPARATORS)
		.map(cleanTeamName)
		.filter((s) => s.length > 0);
}

export type MergeResult = {
	/** Lista resultante (existing + nuevos únicos), sin mutar la entrada. */
	names: string[];
	/** Cuántos nombres nuevos se agregaron de verdad. */
	addedCount: number;
	/** Candidatos rechazados por ya existir (mismo canónico). */
	duplicates: string[];
	/** Candidatos rechazados por superar la longitud máxima. */
	tooLong: string[];
	/** Cuántos candidatos no entraron por superar MAX_TEAMS. */
	overflow: number;
};

/**
 * Agrega `incoming` a `existing` deduplicando por forma canónica.
 * No muta `existing`. Respeta MAX_TEAMS y MAX_TEAM_NAME_LENGTH.
 */
export function mergeTeamNames(existing: string[], incoming: string[]): MergeResult {
	const names = [...existing];
	const seen = new Set<string>();
	for (const n of existing) {
		const c = sanitizeToCanonical(n);
		if (c) seen.add(c);
	}

	const duplicates: string[] = [];
	const tooLong: string[] = [];
	let addedCount = 0;
	let overflow = 0;

	for (const candidateRaw of incoming) {
		const candidate = cleanTeamName(candidateRaw);
		if (!candidate) continue;
		if (candidate.length > MAX_TEAM_NAME_LENGTH) {
			tooLong.push(candidate);
			continue;
		}
		const canonical = sanitizeToCanonical(candidate);
		if (!canonical) continue;
		if (seen.has(canonical)) {
			duplicates.push(candidate);
			continue;
		}
		if (names.length >= MAX_TEAMS) {
			overflow += 1;
			continue;
		}
		seen.add(canonical);
		names.push(candidate);
		addedCount += 1;
	}

	return { names, addedCount, duplicates, tooLong, overflow };
}
