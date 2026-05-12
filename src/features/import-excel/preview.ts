/**
 * features/import-excel/preview.ts
 *
 * Orquestador de la vista previa de importación.
 * Reemplaza `generateBulkPreview` de lib/excel-import-bulk.ts.
 *
 * Flujo para GOLEADORES (≤ 5 queries totales, independiente del tamaño):
 *   1. parseBulkBuffer      → ParsedBulkImport
 *   2. resolveImportEntities → PlayerResolution[] + teamMap   (2–4 queries internas)
 *   3. loadHistoricalSnapshots → Map<playerId, HistoricalSnapshot[]>  (1 query batch)
 *   4. loadTeamGoalTotals   → Map<teamName, goalsFor>              (1 query batch)
 *   5. detectAnomalies      → AnomalyReport[]                  (función pura, sin I/O)
 *
 * Flujo para STANDINGS:
 *   1. parseBulkBuffer      → ParsedBulkImport
 *   2. resolveImportEntities → teamMap                         (1 query)
 *   Sin anomaly detection (las reglas solo aplican a goleadores).
 *
 * Exportaciones públicas:
 *   generatePreview(input) → PreviewResult
 */

import { and, desc, eq, inArray } from "drizzle-orm";
import { db, leagues, playerSeasonStatsSnapshot, teamStandingsSnapshot, teams } from "@/db";
import { resolveImportEntities } from "./resolver";
import { detectAnomalies } from "./anomaly-detector";
import type { AnomalyReport, HistoricalSnapshot } from "./anomaly-detector";
import type { PlayerResolution } from "./resolver";
import type { BulkImportType, GoleadoresRow, StandingsRow, MappedImportOptions } from "./parser";

// ---------------------------------------------------------------------------
// Tipos públicos
// ---------------------------------------------------------------------------

export type PreviewInput = {
	buffer: Buffer;
	leagueId: string;
	/** Si viene de mapeo manual desde la UI; si no, se usa auto-detección. */
	options?: MappedImportOptions;
};

export type PreviewResult = {
	type: BulkImportType;
	jornada?: number;

	/** Filas parseadas (GoleadoresRow[] o StandingsRow[] según type). */
	rows: GoleadoresRow[] | StandingsRow[];

	/** Solo para type === "goleadores". */
	playerResolutions?: PlayerResolution[];

	/** Solo para type === "goleadores". */
	anomalyReports?: AnomalyReport[];

	warnings: string[];
	summary: {
		players?: number;
		teams?: number;
		totalGoals?: number;
		anomalies?: { critical: number; warning: number };
	};
};

// ---------------------------------------------------------------------------
// API pública
// ---------------------------------------------------------------------------

/**
 * Genera la vista previa de una importación Excel.
 * Batch-friendly: número de queries a la DB es constante (no crece con el Excel).
 */
export async function generatePreview(input: PreviewInput): Promise<PreviewResult> {
	const { buffer, leagueId, options } = input;

	// ── Paso 1: Parsear el Excel ─────────────────────────────────────────────
	const parsed = await parseBulkBuffer({ buffer, options });

	// ── Paso 2: Obtener organizationId de la liga (scope del matching intra-org) ─
	// HOTFIX Historia 01: el resolver ahora filtra por org, no por ciudad.
	// organizationId null (liga legacy sin org) → string vacío → comportamiento
	// seguro: no se encuentran candidatos intra-org, se crean jugadores nuevos.
	const league = await db.query.leagues.findFirst({
		where: eq(leagues.id, leagueId),
		columns: { organizationId: true },
	});
	const organizationId = league?.organizationId ?? "";

	// ── Flujo Standings ───────────────────────────────────────────────────────
	if (parsed.type === "standings") {
		return buildStandingsPreview(parsed.rows as StandingsRow[], parsed.jornada, leagueId);
	}

	// ── Flujo Goleadores ──────────────────────────────────────────────────────
	const rows = parsed.rows as GoleadoresRow[];

	// Extraer nombres únicos de jugadores y equipos
	const playerNames = [...new Set(rows.map((r) => r.rawName))];
	const teamNames = [...new Set(rows.map((r) => r.teamName).filter(Boolean))];

	// ── Paso 3: Resolver jugadores y equipos en batch (2–4 queries) ───────────
	const { playerResolutions } = await resolveImportEntities({
		playerNames,
		teamNames,
		leagueId,
		organizationId,
	});

	// ── Paso 4: Cargar snapshots históricos en batch (1 query) ───────────────
	const resolvedPlayerIds = playerResolutions
		.filter((r) => r.found && r.playerId)
		.map((r) => r.playerId as string);

	const history = await loadHistoricalSnapshots(resolvedPlayerIds, leagueId);

	// ── Paso 5: Cargar totales de goles por equipo desde standings (1 query) ──
	const teamGoalTotals = await loadTeamGoalTotals(teamNames, leagueId);

	// ── Paso 6: Detectar anomalías (función pura, sin I/O) ────────────────────
	const playerIdMap = new Map<string, string>(
		playerResolutions
			.filter((r) => r.found && r.playerId)
			.map((r) => [r.rawName, r.playerId as string]),
	);

	const anomalyReports = detectAnomalies({
		rows,
		jornada: parsed.jornada ?? 0,
		history,
		playerIdMap,
		teamGoalTotals,
	});

	// ── Paso 7: Construir warnings ────────────────────────────────────────────
	const warnings = buildWarnings(playerResolutions, anomalyReports);

	// ── Paso 8: Resumen ───────────────────────────────────────────────────────
	const criticalCount = anomalyReports.filter((r) => r.level === "critical").length;
	const warningCount = anomalyReports.filter((r) => r.level === "warning").length;
	const totalGoals = rows.reduce((sum, r) => sum + r.goals, 0);

	return {
		type: "goleadores",
		jornada: parsed.jornada,
		rows,
		playerResolutions,
		anomalyReports,
		warnings,
		summary: {
			players: rows.length,
			totalGoals,
			...(criticalCount + warningCount > 0 && {
				anomalies: { critical: criticalCount, warning: warningCount },
			}),
		},
	};
}

// ---------------------------------------------------------------------------
// Preview de standings (sin anomaly detection)
// ---------------------------------------------------------------------------

async function buildStandingsPreview(
	rows: StandingsRow[],
	jornada: number | undefined,
	leagueId: string,
): Promise<PreviewResult> {
	// Verificar qué equipos ya existen en la liga
	const teamNames = rows.map((r) => r.teamName).filter(Boolean);
	const existingTeams =
		teamNames.length > 0
			? await db.query.teams.findMany({
					where: and(eq(teams.leagueId, leagueId), inArray(teams.name, teamNames)),
					columns: { name: true },
				})
			: [];

	const existingSet = new Set(existingTeams.map((t) => t.name));
	const warnings: string[] = [];

	for (const row of rows) {
		if (row.teamName && !existingSet.has(row.teamName)) {
			warnings.push(`"${row.teamName}" no existe en la liga — se creará automáticamente.`);
		}
	}

	return {
		type: "standings",
		jornada,
		rows,
		warnings,
		summary: { teams: rows.length },
	};
}

// ---------------------------------------------------------------------------
// Carga de snapshots históricos — batch
// ---------------------------------------------------------------------------

/**
 * Carga todos los snapshots de `player_season_stats_snapshot` para los
 * jugadores resueltos, en una sola query.
 * Devuelve Map<playerId, HistoricalSnapshot[]> ordenado por jornada asc.
 */
async function loadHistoricalSnapshots(
	playerIds: string[],
	leagueId: string,
): Promise<Map<string, HistoricalSnapshot[]>> {
	if (playerIds.length === 0) return new Map();

	const rows = await db
		.select({
			playerId: playerSeasonStatsSnapshot.playerId,
			jornada: playerSeasonStatsSnapshot.jornada,
			goals: playerSeasonStatsSnapshot.goals,
			matchesPlayed: playerSeasonStatsSnapshot.matchesPlayed,
		})
		.from(playerSeasonStatsSnapshot)
		.where(
			and(
				inArray(playerSeasonStatsSnapshot.playerId, playerIds),
				eq(playerSeasonStatsSnapshot.leagueId, leagueId),
			),
		)
		.orderBy(playerSeasonStatsSnapshot.playerId, playerSeasonStatsSnapshot.jornada);

	const result = new Map<string, HistoricalSnapshot[]>();

	for (const row of rows) {
		const snapshots = result.get(row.playerId ?? "") ?? [];
		snapshots.push({
			jornada: row.jornada,
			goals: row.goals,
			matchesPlayed: row.matchesPlayed,
		});
		result.set(row.playerId ?? "", snapshots);
	}

	return result;
}

// ---------------------------------------------------------------------------
// Carga de totales de goles por equipo — batch desde standings snapshot
// ---------------------------------------------------------------------------

/**
 * Obtiene el `goalsFor` más reciente (mayor jornada) de cada equipo en la liga.
 * Clave: teamName (sanitizado, igual que en GoleadoresRow).
 * Si un equipo no tiene standings importados, se omite silenciosamente
 * (el anomaly detector maneja este caso).
 */
async function loadTeamGoalTotals(
	teamNames: string[],
	leagueId: string,
): Promise<Map<string, number>> {
	const result = new Map<string, number>();
	if (teamNames.length === 0) return result;

	// Obtener los teamIds para los nombres dados
	const leagueTeams = await db.query.teams.findMany({
		where: and(eq(teams.leagueId, leagueId), inArray(teams.name, teamNames)),
		columns: { id: true, name: true },
	});

	if (leagueTeams.length === 0) return result;

	const teamIdToName = new Map(leagueTeams.map((t) => [t.id, t.name]));
	const teamIds = leagueTeams.map((t) => t.id);

	// Para cada equipo: obtener el snapshot de la jornada más reciente
	// Una sola query con DISTINCT ON sería ideal pero Drizzle no lo soporta
	// nativamente. En su lugar, filtramos por jornada máxima en JS (ya que
	// el volumen es pequeño: ≤ equipos × jornadas en la liga).
	//
	// Alternativa si el volumen crece: usar db.execute(sql`SELECT DISTINCT ON...`)
	const snapshots = await db
		.select({
			teamId: teamStandingsSnapshot.teamId,
			jornada: teamStandingsSnapshot.jornada,
			goalsFor: teamStandingsSnapshot.goalsFor,
		})
		.from(teamStandingsSnapshot)
		.where(
			and(
				inArray(teamStandingsSnapshot.teamId, teamIds),
				eq(teamStandingsSnapshot.leagueId, leagueId),
			),
		)
		.orderBy(teamStandingsSnapshot.teamId, desc(teamStandingsSnapshot.jornada));

	// Tomar solo el snapshot más reciente por equipo (ya ordenados por jornada desc)
	const seen = new Set<string>();
	for (const snap of snapshots) {
		if (!seen.has(snap.teamId)) {
			seen.add(snap.teamId);
			const name = teamIdToName.get(snap.teamId);
			if (name) result.set(name, snap.goalsFor);
		}
	}

	return result;
}

// ---------------------------------------------------------------------------
// Construcción de warnings
// ---------------------------------------------------------------------------

function buildWarnings(resolutions: PlayerResolution[], anomalyReports: AnomalyReport[]): string[] {
	const warnings: string[] = [];

	// Warnings de resolución de jugadores
	for (const res of resolutions) {
		if (!res.found) {
			if (res.candidates.length > 1) {
				warnings.push(
					`"${res.rawName}" tiene ${res.candidates.length} coincidencias — seleccionar manualmente.`,
				);
			} else if (res.candidates.length === 0) {
				warnings.push(`"${res.rawName}" no existe — se creará como jugador nuevo.`);
			}
		}
	}

	// Warnings de anomalías (solo las críticas van como warning prominente)
	const criticals = anomalyReports.filter((r) => r.level === "critical");
	for (const report of criticals) {
		for (const flag of report.flags.filter((f) => f.level === "critical")) {
			warnings.push(`⚠ ${report.rawName}: ${flag.message}`);
		}
	}

	return warnings;
}

// ===========================================================================
// Historia 03 — generateImportPreview (nuevo pipeline por capas)
// ===========================================================================
// Se añade a continuación del código existente para no romper el flujo bulk.
// El flujo bulk (generatePreview) sigue usando resolver.ts durante la transición.
// El nuevo flujo (generateImportPreview) usa matching.ts con player_profiles.

import { parseBulkBuffer } from "./parser";
import { matchRows } from "./matching";
import { normalizePlayerName, fingerprintPlayer, sanitizeName } from "@/shared/lib/normalize";
import { flags } from "@/shared/config/flags";
import type { ParsedRow, ImportPreviewResult, MatchOutcome } from "./types";

/**
 * Genera la vista previa de una importación usando el nuevo motor de matching
 * por capas (L1–L4). Reemplaza generatePreview() para el flujo /api/imports/preview.
 *
 * Input: archivo Excel de goleadores + leagueId + organizationId.
 * Output: MatchOutcome[] listo para que el frontend muestre resolución manual
 *         (solo para kind=intra_org_doubt y kind=cross_org_suggestion).
 */
export async function generateImportPreview(input: {
	buffer: Buffer;
	leagueId: string;
	organizationId: string;
	jornada?: number;
}): Promise<ImportPreviewResult> {
	const { buffer, leagueId, organizationId, jornada } = input;

	// Parsear Excel — reutiliza el parser existente
	const parsed = await parseBulkBuffer({ buffer });

	if (parsed.type !== "goleadores") {
		// Standings no necesita matching de jugadores
		return {
			outcomes: [],
			summary: { auto: 0, doubts: 0, suggestions: 0, createNew: 0 },
			jornada: parsed.jornada,
			warnings: ["El archivo es de posiciones (standings) — usar /api/import/bulk para standings."],
		};
	}

	// Construir ParsedRows desde las GoleadoresRows del parser
	const rows: ParsedRow[] = parsed.rows.map((r) => {
		const rawFullName = sanitizeName(r.rawName);
		const normalizedName = normalizePlayerName(rawFullName);
		return {
			rawFullName,
			normalizedName,
			fingerprint: fingerprintPlayer(rawFullName),
			team: sanitizeName(r.teamName),
			goals: r.goals,
			assists: r.assists ?? 0,
			yellowCards: r.yellowCards ?? 0,
			redCards: r.redCards ?? 0,
			matchesPlayed: r.matchesPlayed ?? 0,
			jornada: jornada ?? parsed.jornada,
		};
	});

	// Deduplicar por fingerprint antes del matching
	const uniqueRows = deduplicateRows(rows);

	// Ejecutar el motor de matching en batch
	const outcomes = await matchRows(uniqueRows, {
		organizationId,
		leagueId,
		crossOrgEnabled: flags.CROSS_ORG_SUGGESTIONS,
	});

	// Construir warnings para la UI
	const warnings = buildImportWarnings(outcomes);

	// Resumen
	const summary = {
		auto: outcomes.filter((o) => o.kind === "auto_resolved").length,
		doubts: outcomes.filter((o) => o.kind === "intra_org_doubt").length,
		suggestions: outcomes.filter((o) => o.kind === "cross_org_suggestion").length,
		createNew: outcomes.filter((o) => o.kind === "create_new").length,
	};

	return { outcomes, summary, jornada: jornada ?? parsed.jornada, warnings };
}

// ---------------------------------------------------------------------------
// Helpers privados del nuevo pipeline
// ---------------------------------------------------------------------------

/**
 * Elimina filas duplicadas por fingerprint.
 * Si el mismo jugador aparece dos veces en el Excel, se toma la primera.
 */
function deduplicateRows(rows: ParsedRow[]): ParsedRow[] {
	const seen = new Set<string>();
	return rows.filter((r) => {
		if (seen.has(r.fingerprint)) return false;
		seen.add(r.fingerprint);
		return true;
	});
}

function buildImportWarnings(outcomes: MatchOutcome[]): string[] {
	const warnings: string[] = [];
	for (const o of outcomes) {
		switch (o.kind) {
			case "auto_resolved":
				if (o.crossLeagueLink) {
					warnings.push(
						`"${o.row.rawFullName}" auto-vinculado desde otra liga (L2). ` +
							`Si es un jugador diferente, usa 'crear nuevo' para separarlo.`,
					);
				}
				break;
			case "intra_org_doubt":
				warnings.push(
					`"${o.row.rawFullName}" tiene ${o.candidates.length} candidato(s) — requiere selección manual.`,
				);
				break;
			case "cross_org_suggestion":
				warnings.push(
					`"${o.row.rawFullName}" coincide con un jugador en otra organización — revisa la sugerencia.`,
				);
				break;
			case "create_new":
				// Silencioso: crear nuevo es el comportamiento esperado para jugadores desconocidos
				break;
		}
	}
	return warnings;
}
