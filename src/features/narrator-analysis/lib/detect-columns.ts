/**
 * features/narrator-analysis/lib/detect-columns.ts
 *
 * Heurística de auto-mapeo: dado el row de encabezados del Excel, sugiere a qué
 * campo del sistema corresponde cada columna. PURO y testeable.
 *
 * Dos pasadas, para evitar que un sinónimo corto le robe la columna a un match
 * exacto (p. ej. "G" de Ganados tomando "GF" por prefijo):
 *   1. EXACTO — el header normalizado es idéntico a un sinónimo. Manda.
 *   2. DIFUSO — startsWith / palabra contenida, solo con sinónimos de 2+ letras
 *      (los de una letra ya se resolvieron en la pasada exacta).
 * Cada columna se asigna a lo sumo a un campo.
 */

import {
	CANONICAL_FIELDS,
	type CanonicalField,
	type ColumnMapping,
} from "@/entities/narrator/model";
import { sanitizeToCanonical } from "@/shared/lib/normalize";
import { COLUMN_SYNONYMS } from "../constants";

export function detectColumns(headers: string[]): ColumnMapping {
	const normalized = headers.map((h) => sanitizeToCanonical(h ?? ""));
	const mapping = emptyMapping();
	const taken = new Set<number>();

	// Pasada 1: coincidencia exacta (la más confiable).
	for (const field of CANONICAL_FIELDS) {
		const idx = normalized.findIndex(
			(h, i) => !taken.has(i) && h !== "" && COLUMN_SYNONYMS[field].includes(h),
		);
		if (idx >= 0) assign(mapping, taken, field, idx);
	}

	// Pasada 2: difusa, solo sinónimos de 2+ letras, para los campos que faltan.
	for (const field of CANONICAL_FIELDS) {
		if (mapping[field] !== null) continue;
		const best = fuzzyBest(field, normalized, taken);
		if (best >= 0) assign(mapping, taken, field, best);
	}

	return mapping;
}

function fuzzyBest(field: CanonicalField, normalized: string[], taken: Set<number>): number {
	const synonyms = COLUMN_SYNONYMS[field].filter((s) => s.length >= 2);
	let best = -1;
	let bestScore = 0;

	normalized.forEach((header, index) => {
		if (taken.has(index) || header === "") return;
		const score = fuzzyScore(header, synonyms);
		if (score > bestScore) {
			bestScore = score;
			best = index;
		}
	});

	return best;
}

function fuzzyScore(header: string, synonyms: string[]): number {
	let score = 0;
	for (const syn of synonyms) {
		if (header.startsWith(syn)) score = Math.max(score, 2);
		else if (header.split(" ").includes(syn)) score = Math.max(score, 1);
	}
	return score;
}

function assign(mapping: ColumnMapping, taken: Set<number>, field: CanonicalField, index: number) {
	mapping[field] = index;
	taken.add(index);
}

function emptyMapping(): ColumnMapping {
	return Object.fromEntries(CANONICAL_FIELDS.map((f) => [f, null])) as ColumnMapping;
}
