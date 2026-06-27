/**
 * entities/narrator/model.ts
 *
 * Contrato único del módulo de análisis pre-partido del narrador (§7.4).
 *
 * Define tres cosas, todas agnósticas a la fuente de datos:
 *   1. El INPUT neutral del motor (`NarratorInput`) — lo produce cualquier
 *      adapter (BD o Excel) y lo consume `computeNarratorAnalysis`.
 *   2. El OUTPUT del motor (`NarratorAnalysis` y sus tipos) — el DTO que viaja
 *      a la UI y al export PDF/PNG. Es el mismo para ambos flujos.
 *   3. Los schemas Zod del flujo Excel público (parseo, mapeo de columnas,
 *      request de análisis) — validan los routes y tipan el cliente.
 *
 * `lib/narrator.ts` (flujo BD legacy) re-exporta los tipos de salida desde
 * aquí para que exista una sola fuente de verdad mientras se migra a FSD (§10).
 */

import { z } from "zod";

// ════════════════════════════════════════════════════════════════════════════
// OUTPUT — DTO del análisis (compartido por el flujo BD y el flujo Excel)
// ════════════════════════════════════════════════════════════════════════════

export type DangerRating = "ALTO" | "MEDIO" | "BAJO";

export type RosterPlayer = {
	playerId: string;
	fullName: string;
	alias: string | null;
	goals: number;
	assists: number;
	contributions: number; // goals + assists — métrica combinada
	yellowCards: number;
	redCards: number;
	matchesPlayed: number;
	goalsPerMatch: number;
	dangerRating: DangerRating;
};

export type TeamStreak = { type: "W" | "D" | "L"; count: number };

export type TeamAnalysis = {
	team: { id: string; name: string };
	position: number | null;
	record: { wins: number; draws: number; losses: number; played: number };
	points: number;
	goalsFor: number;
	goalsAgainst: number;
	goalDiff: number;
	avgGoalsFor: number;
	avgGoalsAgainst: number;
	last5: ("W" | "D" | "L")[];
	currentStreak: TeamStreak | null;
	roster: RosterPlayer[];
	topScorer: RosterPlayer | null;
	topAssist: RosterPlayer | null;
	topContributor: RosterPlayer | null;
	topScoringThreats: RosterPlayer[];
	cardRisk: {
		player: string;
		alias: string | null;
		yellowCards: number;
		redCards: number;
		note: string;
	}[];
	attackRank: number | null;
	defenseRank: number | null;
	totalTeams: number;
};

export type H2HRecord = {
	total: number;
	aWins: number;
	draws: number;
	bWins: number;
	lastMatch: {
		date: string;
		aGoals: number;
		bGoals: number;
		result: string;
	} | null;
};

export type WinProbability = {
	aWinPct: number;
	drawPct: number;
	bWinPct: number;
	method: string;
};

export type PositionScenario = {
	currentPoints: number;
	currentPosition: number | null;
	ifWin: number | null;
	ifDraw: number | null;
	ifLoss: number | null;
};

export type PositionSimulator = {
	teamA: PositionScenario;
	teamB: PositionScenario;
};

export type LeagueStandingRow = {
	teamId: string;
	points: number;
	goalsFor: number;
	goalsAgainst: number;
};

export type MatchPrediction = {
	expectedGoalsA: number;
	expectedGoalsB: number;
	expectedTotal: number;
	totalLabel: "cerrado" | "abierto" | "festival";
	likelyScoreA: number;
	likelyScoreB: number;
	bothTeamsToScore: boolean;
	offensiveEdge: "A" | "B" | "equal";
	defensiveEdge: "A" | "B" | "equal";
	hasData: boolean;
};

export type NarratorAnalysis = {
	league: { id: string; name: string; season: string };
	lastMatchday: number | null;
	teamA: TeamAnalysis;
	teamB: TeamAnalysis;
	winProbability: WinProbability;
	headToHead: H2HRecord;
	positionSimulator: PositionSimulator;
	matchPrediction: MatchPrediction;
	narratorBullets: string[];
	funFacts: string[];
};

// ════════════════════════════════════════════════════════════════════════════
// INPUT — shape neutral que alimenta el motor (lo produce cada adapter)
// ════════════════════════════════════════════════════════════════════════════

/**
 * Partido completado, en forma neutral. El adapter BD lo llena desde `matches`;
 * el adapter Excel lo deja vacío (la tabla de posiciones no trae historial).
 */
export type NarratorMatch = {
	homeTeamId: string;
	awayTeamId: string;
	homeScore: number | null;
	awayScore: number | null;
	matchDate: string;
};

/** Datos de un equipo, ya resueltos por el adapter. */
export type TeamInputData = {
	team: { id: string; name: string };
	position: number | null;
	record: { wins: number; draws: number; losses: number; played: number };
	points: number;
	goalsFor: number;
	goalsAgainst: number;
	last5: ("W" | "D" | "L")[];
	currentStreak: TeamStreak | null;
	/** Plantel con stats. Vacío en el flujo Excel (solo tabla de posiciones). */
	roster: RosterPlayer[];
};

/**
 * Entrada completa del motor. Cualquier fuente (BD, Excel, futuras) produce
 * esto y `computeNarratorAnalysis` hace el resto sin saber de dónde vino.
 */
export type NarratorInput = {
	league: { id: string; name: string; season: string };
	lastMatchday: number | null;
	teamA: TeamInputData;
	teamB: TeamInputData;
	/** Tabla de la liga completa, para ranks de ataque/defensa y simulador. */
	standings: LeagueStandingRow[];
	/** Partidos completados, para H2H y forma. Vacío en el flujo Excel. */
	matches: NarratorMatch[];
};

// ════════════════════════════════════════════════════════════════════════════
// EXCEL — campos canónicos, mapeo de columnas y schemas Zod del flujo público
// ════════════════════════════════════════════════════════════════════════════

/**
 * Campos a los que el usuario mapea las columnas de su Excel.
 * `team`, `points`, `goalsFor` y `goalsAgainst` son los mínimos para un
 * análisis útil; el resto enriquece pero es opcional.
 */
export const CANONICAL_FIELDS = [
	"team",
	"position",
	"played",
	"wins",
	"draws",
	"losses",
	"goalsFor",
	"goalsAgainst",
	"points",
] as const;

export type CanonicalField = (typeof CANONICAL_FIELDS)[number];

export const REQUIRED_FIELDS: readonly CanonicalField[] = [
	"team",
	"points",
	"goalsFor",
	"goalsAgainst",
] as const;

/** Índice de columna (0-based) asignado a cada campo, o null si no se mapeó. */
export type ColumnMapping = Record<CanonicalField, number | null>;

export const ColumnMappingSchema = z.object(
	Object.fromEntries(
		CANONICAL_FIELDS.map((f) => [f, z.number().int().min(0).nullable()]),
	) as Record<CanonicalField, z.ZodNullable<z.ZodNumber>>,
) satisfies z.ZodType<ColumnMapping>;

/** Una fila de la tabla de posiciones ya normalizada desde el Excel. */
export type ExcelStandingRow = {
	teamId: string; // canónico del nombre — estable para selección sin BD
	teamName: string; // sanitizado (lowercase); la UI aplica titleCase
	position: number | null;
	played: number;
	wins: number;
	draws: number;
	losses: number;
	goalsFor: number;
	goalsAgainst: number;
	points: number;
};

/**
 * Respuesta del route de parseo: la matriz COMPLETA del Excel + la fila de
 * encabezados que adivinamos. El cliente deja al usuario corregir cuál fila es
 * el header (como en el wizard) y deriva headers/datos desde ahí.
 */
export type ParseExcelResult = {
	grid: string[][]; // matriz completa, acotada a los límites
	headerRowIndex: number; // mejor adivinanza de la fila de encabezados
	suggestedMapping: ColumnMapping; // detectado sobre grid[headerRowIndex]
};

// ── Request del route /analyze ──────────────────────────────────────────────
// El cliente reenvía el grid (chico) para mantener el server stateless.

export const AnalyzeExcelRequestSchema = z
	.object({
		headers: z.array(z.string()).min(1).max(50),
		rows: z.array(z.array(z.string()).max(50)).min(2).max(500),
		mapping: ColumnMappingSchema,
		teamAId: z.string().min(1),
		teamBId: z.string().min(1),
		// Obligatorio: alimenta el historial de uso por liga (métrica comercial).
		leagueName: z.string().trim().min(2, "Escribe el nombre de la liga").max(120),
		season: z.string().max(50).optional(),
	})
	.refine((d) => d.teamAId !== d.teamBId, {
		message: "Los dos equipos deben ser diferentes",
		path: ["teamBId"],
	})
	.refine((d) => REQUIRED_FIELDS.every((f) => d.mapping[f] !== null), {
		message: "Faltan columnas obligatorias en el mapeo",
		path: ["mapping"],
	});

export type AnalyzeExcelRequest = z.infer<typeof AnalyzeExcelRequestSchema>;

// ── Métricas de uso ─────────────────────────────────────────────────────────

export const NARRATOR_SOURCES = ["excel", "database"] as const;
export type NarratorSource = (typeof NARRATOR_SOURCES)[number];

export type NarratorUsageStats = {
	total: number;
	last7Days: number;
	bySource: { source: NarratorSource; count: number }[];
	/** Ligas donde más se usa la herramienta — insumo comercial. */
	byLeague: { leagueName: string; count: number }[];
};
