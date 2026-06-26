/**
 * features/narrator-analysis/lib/normalize-standings.ts
 *
 * Aplica el ColumnMapping al grid crudo del Excel y devuelve filas de tabla de
 * posiciones tipadas y limpias. PURO y testeable.
 *
 * Reglas:
 *  - Se ignoran filas sin nombre de equipo (separadores, totales, vacías).
 *  - Números no parseables → 0.
 *  - Si `played` no se mapeó, se deriva de wins + draws + losses.
 *  - `teamId` es el nombre canónico (estable para selección sin BD).
 */

import {
	type ColumnMapping,
	type ExcelStandingRow,
	type CanonicalField,
} from "@/entities/narrator/model";
import { sanitizeName, sanitizeToCanonical } from "@/shared/lib/normalize";

export function normalizeStandings(rows: string[][], mapping: ColumnMapping): ExcelStandingRow[] {
	const result: ExcelStandingRow[] = [];
	const seen = new Set<string>();

	for (const row of rows) {
		const standing = rowToStanding(row, mapping);
		if (!standing) continue;
		if (seen.has(standing.teamId)) continue; // dedupe por nombre canónico
		seen.add(standing.teamId);
		result.push(standing);
	}

	return result;
}

function rowToStanding(row: string[], mapping: ColumnMapping): ExcelStandingRow | null {
	const rawTeam = cell(row, mapping.team);
	const teamName = sanitizeName(rawTeam);
	if (teamName === "") return null;

	const teamId = sanitizeToCanonical(rawTeam);
	if (teamId === "") return null;

	const wins = num(row, mapping, "wins");
	const draws = num(row, mapping, "draws");
	const losses = num(row, mapping, "losses");
	const mappedPlayed = num(row, mapping, "played");
	const played = mapping.played !== null ? mappedPlayed : wins + draws + losses;

	return {
		teamId,
		teamName,
		position: mapping.position !== null ? num(row, mapping, "position") || null : null,
		played,
		wins,
		draws,
		losses,
		goalsFor: num(row, mapping, "goalsFor"),
		goalsAgainst: num(row, mapping, "goalsAgainst"),
		points: num(row, mapping, "points"),
	};
}

function num(row: string[], mapping: ColumnMapping, field: CanonicalField): number {
	return parseIntSafe(cell(row, mapping[field]));
}

function cell(row: string[], index: number | null): string {
	if (index === null || index < 0 || index >= row.length) return "";
	return (row[index] ?? "").trim();
}

function parseIntSafe(raw: string): number {
	if (raw === "") return 0;
	// Toma el primer entero (con signo) del texto: "12 pts" → 12, "-3" → -3
	const match = raw.replace(",", "").match(/-?\d+/);
	if (!match) return 0;
	const parsed = Number.parseInt(match[0], 10);
	return Number.isFinite(parsed) ? parsed : 0;
}
