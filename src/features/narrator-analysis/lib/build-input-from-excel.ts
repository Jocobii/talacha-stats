/**
 * features/narrator-analysis/lib/build-input-from-excel.ts
 *
 * Adapter Excel → NarratorInput. Toma las filas ya normalizadas de la tabla de
 * posiciones y el par de equipos elegidos, y produce el input neutral que come
 * el motor. PURO y testeable.
 *
 * Limitación de la fuente: la tabla de posiciones es a nivel equipo. No hay
 * plantel, ni historial de partidos, así que `roster`, `last5`, `currentStreak`
 * y `matches` van vacíos — el motor degrada esas secciones con elegancia.
 */

import type {
	ExcelStandingRow,
	LeagueStandingRow,
	NarratorInput,
	TeamInputData,
} from "@/entities/narrator/model";

export type BuildInputFromExcelArgs = {
	standings: ExcelStandingRow[];
	teamAId: string;
	teamBId: string;
	leagueName?: string | null;
	season?: string | null;
};

export function buildInputFromExcel(args: BuildInputFromExcelArgs): NarratorInput | null {
	const { standings, teamAId, teamBId } = args;

	const rowA = standings.find((r) => r.teamId === teamAId);
	const rowB = standings.find((r) => r.teamId === teamBId);
	if (!rowA || !rowB) return null;

	const positions = derivePositions(standings);

	return {
		league: {
			id: "excel",
			name: args.leagueName?.trim() || "Liga (Excel)",
			season: args.season?.trim() || "",
		},
		lastMatchday: null,
		teamA: toTeamInput(rowA, positions),
		teamB: toTeamInput(rowB, positions),
		standings: standings.map(toLeagueStandingRow),
		matches: [],
	};
}

function toTeamInput(row: ExcelStandingRow, positions: Map<string, number>): TeamInputData {
	return {
		team: { id: row.teamId, name: row.teamName },
		position: row.position ?? positions.get(row.teamId) ?? null,
		record: { wins: row.wins, draws: row.draws, losses: row.losses, played: row.played },
		points: row.points,
		goalsFor: row.goalsFor,
		goalsAgainst: row.goalsAgainst,
		last5: [],
		currentStreak: null,
		roster: [],
	};
}

function toLeagueStandingRow(row: ExcelStandingRow): LeagueStandingRow {
	return {
		teamId: row.teamId,
		points: row.points,
		goalsFor: row.goalsFor,
		goalsAgainst: row.goalsAgainst,
	};
}

/** Posición derivada por puntos → dif. de goles → goles a favor (desempate estándar). */
function derivePositions(standings: ExcelStandingRow[]): Map<string, number> {
	const sorted = [...standings].sort((a, b) => {
		if (b.points !== a.points) return b.points - a.points;
		const diff = b.goalsFor - b.goalsAgainst - (a.goalsFor - a.goalsAgainst);
		if (diff !== 0) return diff;
		return b.goalsFor - a.goalsFor;
	});
	return new Map(sorted.map((r, i) => [r.teamId, i + 1]));
}
