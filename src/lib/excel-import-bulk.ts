import { readWorkbook, sheetToArrays, sheetToObjects, type ParsedSheet } from "@/shared/lib/excel";
import { sql } from "drizzle-orm";
import { ilike, and, eq, inArray, desc } from "drizzle-orm";
import {
	db,
	players,
	teams,
	leagues,
	playerSeasonStats,
	playerSeasonStatsSnapshot,
	teamStandingsSnapshot,
	playerRegistrations,
} from "@/db";
import { sanitizeName } from "@/shared/lib/normalize";

// ---------------------------------------------------------------------------
// TIPOS
// ---------------------------------------------------------------------------

export type BulkImportType = "goleadores" | "standings";

export type GoleadoresRow = {
	rawName: string;
	teamName: string;
	goals: number;
	assists?: number;
	yellowCards?: number;
	redCards?: number;
	matchesPlayed?: number;
};

export type StandingsRow = {
	position: number;
	teamName: string;
	played: number;
	wins: number;
	draws: number;
	losses: number;
	goalsFor: number;
	goalsAgainst: number;
	points: number;
	zone?: string;
};

export type ParsedBulkImport =
	| { type: "goleadores"; rows: GoleadoresRow[]; jornada?: number }
	| { type: "standings"; rows: StandingsRow[]; jornada?: number };

export type CandidateTeam = {
	teamName: string;
	leagueName: string;
};

export type PlayerCandidate = {
	id: string;
	fullName: string;
	alias: string | null;
	teams: CandidateTeam[];
};

export type PlayerResolution = {
	rawName: string;
	teamName: string;
	found: boolean;
	playerId?: string;
	candidates: PlayerCandidate[];
};

export type BulkImportPreview = {
	type: BulkImportType;
	jornada?: number;
	rows: GoleadoresRow[] | StandingsRow[];
	playerResolutions?: PlayerResolution[]; // solo para goleadores
	warnings: string[];
	summary: { players?: number; teams?: number; totalGoals?: number };
};

export type BulkConfirmPayload = {
	leagueId: string;
	parsed: ParsedBulkImport;
	playerResolutions?: Record<string, string>; // rawName → playerId | "NEW"
};

export type BulkImportResult = {
	type: BulkImportType;
	upserted: number;
	created: number;
	warnings: string[];
};

// ---------------------------------------------------------------------------
// COLUMN MAP — tipos para mapeo manual de columnas
// ---------------------------------------------------------------------------

export type ColumnMap = Record<string, string>;

export type MappedImportOptions = {
	type: BulkImportType;
	sheetName?: string;
	headerRow: number;
	columnMap: ColumnMap;
	jornada?: number;
};

// ---------------------------------------------------------------------------
// FUZZY MATCHING — búsqueda por similitud con unaccent + pg_trgm
//
// Estrategia en dos pasos:
//   1. Buscar jugadores ya registrados en ligas de la misma ciudad
//   2. Si no hay resultados, búsqueda global (fallback)
//
// Umbral de similitud: 0.45 — filtra falsos positivos de nombres que comparten
// palabras comunes (carlos, guerrero) sin descartar typos reales (≥ 0.50).
//
// Coincidencia dominante: si el top candidato supera DOMINANT_MIN y su ventaja
// sobre el segundo es ≥ DOMINANT_GAP, se auto-confirma aunque haya más candidatos.
// Esto evita que nombres muy específicos queden como "ambiguos" cuando la
// similitud con el resto es marginal.
// ---------------------------------------------------------------------------

const SIMILARITY_THRESHOLD = 0.45;
const DOMINANT_SCORE_MIN = 0.65;
const DOMINANT_GAP_MIN   = 0.25;

type PlayerMatchRow = {
	id: string;
	full_name: string;
	alias: string | null;
	score: number;
};

async function findSimilarPlayers(
	normalizedName: string,
	city: string,
): Promise<PlayerMatchRow[]> {
	// ── Paso 1: jugadores que ya jugaron en esta ciudad ──────────────────────
	const cityResult = await db.execute<PlayerMatchRow>(sql`
		SELECT DISTINCT ON (p.id)
			p.id,
			p.full_name,
			p.alias,
			GREATEST(
				similarity(f_unaccent(p.full_name), f_unaccent(${normalizedName})),
				COALESCE(similarity(f_unaccent(p.alias), f_unaccent(${normalizedName})), 0)
			) AS score
		FROM players p
		WHERE (
				similarity(f_unaccent(p.full_name), f_unaccent(${normalizedName})) > ${SIMILARITY_THRESHOLD}
				OR (p.alias IS NOT NULL AND similarity(f_unaccent(p.alias), f_unaccent(${normalizedName})) > ${SIMILARITY_THRESHOLD})
			)
			AND EXISTS (
				SELECT 1
				FROM player_registrations pr
				JOIN leagues l ON l.id = pr.league_id
				WHERE pr.player_id = p.id
				  AND l.city = ${city}
			)
		ORDER BY p.id, score DESC
		LIMIT 5
	`);

	if (cityResult.rows.length > 0) {
		return cityResult.rows.sort((a, b) => b.score - a.score);
	}

	// ── Paso 2: fallback global ───────────────────────────────────────────────
	const globalResult = await db.execute<PlayerMatchRow>(sql`
		SELECT
			p.id,
			p.full_name,
			p.alias,
			GREATEST(
				similarity(f_unaccent(p.full_name), f_unaccent(${normalizedName})),
				COALESCE(similarity(f_unaccent(p.alias), f_unaccent(${normalizedName})), 0)
			) AS score
		FROM players p
		WHERE
			similarity(f_unaccent(p.full_name), f_unaccent(${normalizedName})) > ${SIMILARITY_THRESHOLD}
			OR (p.alias IS NOT NULL AND similarity(f_unaccent(p.alias), f_unaccent(${normalizedName})) > ${SIMILARITY_THRESHOLD})
		ORDER BY score DESC
		LIMIT 5
	`);

	return globalResult.rows;
}

// Enriquece una lista de candidatos con sus equipos en ligas activas.
// Una sola query para todos los IDs — sin N+1.
async function enrichWithActiveTeams(rows: PlayerMatchRow[]): Promise<PlayerCandidate[]> {
	if (rows.length === 0) return [];

	const ids = rows.map(r => r.id);
	const teamRows = await db
		.select({
			playerId:   playerRegistrations.playerId,
			teamName:   teams.name,
			leagueName: leagues.name,
		})
		.from(playerRegistrations)
		.innerJoin(teams,   eq(teams.id,   playerRegistrations.teamId))
		.innerJoin(leagues, eq(leagues.id, playerRegistrations.leagueId))
		.where(and(
			inArray(playerRegistrations.playerId, ids),
			eq(leagues.status, "active"),
		))
		.orderBy(desc(leagues.createdAt));

	const teamsByPlayer = new Map<string, CandidateTeam[]>();
	for (const row of teamRows) {
		const list = teamsByPlayer.get(row.playerId) ?? [];
		list.push({ teamName: row.teamName, leagueName: row.leagueName });
		teamsByPlayer.set(row.playerId, list);
	}

	return rows.map(r => ({
		id:       r.id,
		fullName: r.full_name,
		alias:    r.alias,
		teams:    teamsByPlayer.get(r.id) ?? [],
	}));
}

// ---------------------------------------------------------------------------
// PARSER CON MAPEO MANUAL DE COLUMNAS
// ---------------------------------------------------------------------------

export async function parseBulkExcelMapped(
	buffer: Buffer,
	options: MappedImportOptions,
): Promise<ParsedBulkImport> {
	const workbook = await readWorkbook(buffer);
	const sheetName = options.sheetName ?? workbook.sheetNames[0];
	const sheet = workbook.sheets[sheetName];
	if (!sheet) throw new Error(`Hoja "${sheetName}" no encontrada`);

	const allRows = sheetToArrays(sheet);

	const dataRows = allRows
		.slice(options.headerRow + 1)
		.filter((row) => row.some((cell) => cell !== ""));

	const map = options.columnMap;

	function getCell(row: string[], field: string): string {
		const idx = map[field];
		if (idx === undefined) return "";
		const i = parseInt(idx);
		return isNaN(i) ? "" : (row[i] ?? "");
	}

	if (options.type === "goleadores") {
		const rows: GoleadoresRow[] = [];
		for (const row of dataRows) {
			const rawName = sanitizeName(getCell(row, "rawName"));
			if (!rawName) continue;

			rows.push({
				rawName,
				teamName: sanitizeName(getCell(row, "teamName")),
				goals: num(getCell(row, "goals")),
				assists: map.assists !== undefined ? num(getCell(row, "assists")) : undefined,
				yellowCards: map.yellowCards !== undefined ? num(getCell(row, "yellowCards")) : undefined,
				redCards: map.redCards !== undefined ? num(getCell(row, "redCards")) : undefined,
				matchesPlayed: map.matchesPlayed !== undefined ? num(getCell(row, "matchesPlayed")) : undefined,
			});
		}
		return { type: "goleadores", rows, jornada: options.jornada };
	} else {
		const rows: StandingsRow[] = [];
		let pos = 1;
		for (const row of dataRows) {
			const teamName = sanitizeName(getCell(row, "teamName"));
			if (!teamName) continue;
			if (["liguilla", "copa", "recopa"].includes(teamName)) continue;

			rows.push({
				position: pos++,
				teamName,
				played: num(getCell(row, "played")),
				wins: num(getCell(row, "wins")),
				draws: num(getCell(row, "draws")),
				losses: num(getCell(row, "losses")),
				goalsFor: num(getCell(row, "goalsFor")),
				goalsAgainst: num(getCell(row, "goalsAgainst")),
				points: num(getCell(row, "points")),
			});
		}
		return { type: "standings", rows, jornada: options.jornada };
	}
}

// ---------------------------------------------------------------------------
// PARSER AUTOMÁTICO (auto-detect de tipo y columnas)
// ---------------------------------------------------------------------------

export async function parseBulkExcel(buffer: Buffer): Promise<ParsedBulkImport> {
	const workbook = await readWorkbook(buffer);

	for (const sheetName of workbook.sheetNames) {
		const sheet = workbook.sheets[sheetName];
		const rows = sheetToObjects(sheet);

		if (rows.length === 0) continue;

		const jornada = detectJornada(sheetName, sheet);

		const goleadoresResult = tryParseGoleadores(rows, jornada);
		if (goleadoresResult) return goleadoresResult;

		const standingsResult = tryParseStandings(rows, jornada);
		if (standingsResult) return standingsResult;
	}

	throw new Error("No se reconoció ningún formato válido en el archivo.");
}

// ---------------------------------------------------------------------------
// PARSER INTERNO: Goleadores
// ---------------------------------------------------------------------------

function tryParseGoleadores(
	rows: Record<string, unknown>[],
	jornada?: number,
): ParsedBulkImport | null {
	const sample = rows.find((r) => hasAnyValue(r));
	if (!sample) return null;

	const keys = Object.keys(sample);
	const nameCol = findCol(keys, [
		"nombre de jugador",
		"nombre",
		"jugador",
		"player",
	]);
	const teamCol = findCol(keys, ["equipo", "team", "club"]);
	const goalsCol = findCol(keys, ["goles", "goals", "gls", "g"]);

	if (!nameCol || !goalsCol) return null;

	const assistsCol  = findCol(keys, ["asistencias", "assists", "ast", "a"]);
	const yellowCol   = findCol(keys, ["amarillas", "yellow", "ta"]);
	const redCol      = findCol(keys, ["rojas", "red", "tr"]);
	const playedCol   = findCol(keys, ["partidos", "jugados", "pj", "jj"]);

	const result: GoleadoresRow[] = [];

	for (const row of rows) {
		const rawName = sanitizeName(str(row[nameCol!]));
		const goals   = num(row[goalsCol!]);

		if (!rawName) continue;
		if (rawName.includes("nombre") || rawName.includes("jugador")) continue;
		if (/^\d+$/.test(rawName)) continue;

		result.push({
			rawName,
			teamName: teamCol ? sanitizeName(str(row[teamCol])) : "",
			goals,
			assists:     assistsCol ? num(row[assistsCol]) : undefined,
			yellowCards: yellowCol   ? num(row[yellowCol])  : undefined,
			redCards:    redCol      ? num(row[redCol])     : undefined,
			matchesPlayed: playedCol ? num(row[playedCol])  : undefined,
		});
	}

	if (result.length === 0) return null;
	return { type: "goleadores", rows: result, jornada };
}

// ---------------------------------------------------------------------------
// PARSER INTERNO: Standings
// ---------------------------------------------------------------------------

function tryParseStandings(
	rows: Record<string, unknown>[],
	jornada?: number,
): ParsedBulkImport | null {
	const sample = rows.find((r) => hasAnyValue(r));
	if (!sample) return null;

	const keys    = Object.keys(sample);
	const teamCol = findCol(keys, ["equipo", "team", "club", "nombre"]);
	const ptsCol  = findCol(keys, ["pts", "puntos", "points", "ptos"]);

	if (!teamCol || !ptsCol) return null;

	const playedCol = findCol(keys, ["jj", "pj", "jugados", "played", "gp"]);
	const winsCol   = findCol(keys, ["jg", "ganados", "wins", "won", "w", "g"]);
	const drawsCol  = findCol(keys, ["je", "empatados", "draws", "drawn", "d", "e"]);
	const lossesCol = findCol(keys, ["jp", "perdidos", "losses", "lost", "l", "p"]);
	const gfCol     = findCol(keys, ["gf", "goles a favor", "goals for", "for"]);
	const gcCol     = findCol(keys, ["gc", "goles en contra", "goals against", "against"]);

	const result: StandingsRow[] = [];
	let pos = 1;

	for (const row of rows) {
		const teamName = sanitizeName(str(row[teamCol!]));

		if (!teamName) continue;
		if (["equipo", "team", "liguilla", "copa", "recopa", "zona"].includes(teamName)) continue;

		const zone = detectZone(row);

		result.push({
			position: pos++,
			teamName,
			played:       playedCol ? num(row[playedCol]) : 0,
			wins:         winsCol   ? num(row[winsCol])   : 0,
			draws:        drawsCol  ? num(row[drawsCol])  : 0,
			losses:       lossesCol ? num(row[lossesCol]) : 0,
			goalsFor:     gfCol     ? num(row[gfCol])     : 0,
			goalsAgainst: gcCol     ? num(row[gcCol])     : 0,
			points:       num(row[ptsCol!]),
			zone:         zone ?? undefined,
		});
	}

	if (result.length < 2) return null;
	return { type: "standings", rows: result, jornada };
}

// ---------------------------------------------------------------------------
// PREVIEW — analiza sin insertar
// ---------------------------------------------------------------------------

export async function generateBulkPreview(
	parsed: ParsedBulkImport,
	leagueId: string,
): Promise<BulkImportPreview> {
	const warnings: string[] = [];

	// Obtener la ciudad de la liga para el scope del matching
	const league = await db.query.leagues.findFirst({
		where: eq(leagues.id, leagueId),
		columns: { city: true },
	});
	const city = league?.city ?? "";

	if (parsed.type === "goleadores") {
		const rows = parsed.rows as GoleadoresRow[];
		const playerResolutions: PlayerResolution[] = [];

		for (const row of rows) {
			const matches = await findSimilarPlayers(row.rawName, city);
			const candidates = await enrichWithActiveTeams(matches);

			const isExact =
				matches.length >= 1 &&
				matches[0].score >= 0.95;

			const isDominant =
				matches.length >= 2 &&
				matches[0].score >= DOMINANT_SCORE_MIN &&
				matches[0].score - matches[1].score >= DOMINANT_GAP_MIN;

			if (matches.length === 1 || isExact || isDominant) {
				playerResolutions.push({
					rawName:  row.rawName,
					teamName: row.teamName,
					found:    true,
					playerId: matches[0].id,
					candidates,
				});
			} else if (matches.length > 1) {
				playerResolutions.push({
					rawName:  row.rawName,
					teamName: row.teamName,
					found:    false,
					candidates,
				});
				warnings.push(
					`"${row.rawName}" tiene ${matches.length} coincidencias — seleccionar manualmente.`,
				);
			} else {
				playerResolutions.push({
					rawName:    row.rawName,
					teamName:   row.teamName,
					found:      false,
					candidates: [],
				});
				warnings.push(
					`"${row.rawName}" no existe — se creará como jugador nuevo.`,
				);
			}
		}

		const totalGoals = rows.reduce((s, r) => s + r.goals, 0);

		return {
			type: "goleadores",
			jornada: parsed.jornada,
			rows,
			playerResolutions,
			warnings,
			summary: { players: rows.length, totalGoals },
		};
	}

	// ── standings ──────────────────────────────────────────────────────────────
	const rows = parsed.rows as StandingsRow[];
	const teamWarnings: string[] = [];

	for (const row of rows) {
		const existing = await db.query.teams.findFirst({
			where: and(
				ilike(teams.name, row.teamName),
				eq(teams.leagueId, leagueId),
			),
		});
		if (!existing) {
			teamWarnings.push(
				`"${row.teamName}" no existe en la liga — se creará automáticamente.`,
			);
		}
	}

	return {
		type: "standings",
		jornada: parsed.jornada,
		rows,
		warnings: [...warnings, ...teamWarnings],
		summary: { teams: rows.length },
	};
}

// ---------------------------------------------------------------------------
// CONFIRM — inserta o actualiza en la base de datos
//
// Todo corre dentro de una transacción: si algo falla, se hace rollback
// completo y la BD queda en el estado anterior a la importación.
// ---------------------------------------------------------------------------

export async function confirmBulkImport(
	payload: BulkConfirmPayload,
): Promise<BulkImportResult> {
	const { leagueId, parsed, playerResolutions = {} } = payload;
	const warnings: string[] = [];
	let upserted = 0;
	let created  = 0;

	await db.transaction(async (tx) => {
		if (parsed.type === "goleadores") {
			const rows = parsed.rows as GoleadoresRow[];

			for (const row of rows) {
				// 1. Resolver jugador ──────────────────────────────────────────
				let playerId = playerResolutions[row.rawName];

				if (!playerId || playerId === "NEW") {
					const [newPlayer] = await tx
						.insert(players)
						.values({ fullName: sanitizeName(row.rawName) })
						.returning();
					playerId = newPlayer.id;
					created++;
				}

				// 2. Resolver equipo ───────────────────────────────────────────
				let teamId: string | null = null;
				if (row.teamName) {
					const sanitizedTeam = sanitizeName(row.teamName);
					const existingTeam  = await tx.query.teams.findFirst({
						where: and(
							ilike(teams.name, sanitizedTeam),
							eq(teams.leagueId, leagueId),
						),
					});
					if (existingTeam) {
						teamId = existingTeam.id;
					} else {
						const [newTeam] = await tx
							.insert(teams)
							.values({ name: sanitizedTeam, leagueId })
							.returning();
						teamId = newTeam.id;
						created++;
					}
				}

				// 3. Registrar jugador en equipo si no está ────────────────────
				if (teamId) {
					await tx
						.insert(playerRegistrations)
						.values({ playerId, teamId, leagueId })
						.onConflictDoNothing();
				}

				// 4. Upsert stats acumuladas (estado actual de la temporada) ───
				await tx
					.insert(playerSeasonStats)
					.values({
						playerId,
						leagueId,
						teamId,
						goals:        row.goals,
						assists:      row.assists      ?? 0,
						yellowCards:  row.yellowCards  ?? 0,
						redCards:     row.redCards     ?? 0,
						matchesPlayed: row.matchesPlayed ?? 0,
						jornada:      parsed.jornada ?? null,
						updatedAt:    new Date(),
					})
					.onConflictDoUpdate({
						target: [playerSeasonStats.playerId, playerSeasonStats.leagueId],
						set: {
							goals:        row.goals,
							assists:      row.assists      ?? 0,
							yellowCards:  row.yellowCards  ?? 0,
							redCards:     row.redCards     ?? 0,
							matchesPlayed: row.matchesPlayed ?? 0,
							jornada:      parsed.jornada ?? null,
							updatedAt:    new Date(),
							...(teamId ? { teamId } : {}),
						},
					});

				// 5. Snapshot histórico por jornada ────────────────────────────
				if (parsed.jornada != null) {
					await tx
						.insert(playerSeasonStatsSnapshot)
						.values({
							playerId,
							leagueId,
							teamId,
							jornada:      parsed.jornada,
							goals:        row.goals,
							assists:      row.assists      ?? 0,
							yellowCards:  row.yellowCards  ?? 0,
							redCards:     row.redCards     ?? 0,
							matchesPlayed: row.matchesPlayed ?? 0,
							importedAt:   new Date(),
						})
						.onConflictDoUpdate({
							target: [
								playerSeasonStatsSnapshot.playerId,
								playerSeasonStatsSnapshot.leagueId,
								playerSeasonStatsSnapshot.jornada,
							],
							set: {
								goals:        row.goals,
								assists:      row.assists      ?? 0,
								yellowCards:  row.yellowCards  ?? 0,
								redCards:     row.redCards     ?? 0,
								matchesPlayed: row.matchesPlayed ?? 0,
								importedAt:   new Date(),
								...(teamId ? { teamId } : {}),
							},
						});
				}

				upserted++;
			}
		} else {
			// ── standings ─────────────────────────────────────────────────────
			const rows = parsed.rows as StandingsRow[];

			for (const row of rows) {
				const sanitizedTeam = sanitizeName(row.teamName);

				let teamId: string;
				const existingTeam = await tx.query.teams.findFirst({
					where: and(
						ilike(teams.name, sanitizedTeam),
						eq(teams.leagueId, leagueId),
					),
				});

				if (existingTeam) {
					teamId = existingTeam.id;
				} else {
					const [newTeam] = await tx
						.insert(teams)
						.values({ name: sanitizedTeam, leagueId })
						.returning();
					teamId = newTeam.id;
					created++;
				}

				const jornada = parsed.jornada ?? 1;

				await tx
					.insert(teamStandingsSnapshot)
					.values({
						teamId,
						leagueId,
						jornada,
						played:       row.played,
						wins:         row.wins,
						draws:        row.draws,
						losses:       row.losses,
						goalsFor:     row.goalsFor,
						goalsAgainst: row.goalsAgainst,
						points:       row.points,
						zone:         row.zone ?? null,
						updatedAt:    new Date(),
					})
					.onConflictDoUpdate({
						target: [
							teamStandingsSnapshot.teamId,
							teamStandingsSnapshot.leagueId,
							teamStandingsSnapshot.jornada,
						],
						set: {
							played:       row.played,
							wins:         row.wins,
							draws:        row.draws,
							losses:       row.losses,
							goalsFor:     row.goalsFor,
							goalsAgainst: row.goalsAgainst,
							points:       row.points,
							zone:         row.zone ?? null,
							updatedAt:    new Date(),
						},
					});

				upserted++;
			}
		}
	});

	return { type: parsed.type, upserted, created, warnings };
}

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

function findCol(keys: string[], candidates: string[]): string | undefined {
	for (const key of keys) {
		const k = key.toLowerCase().trim();
		if (candidates.some((c) => k.includes(c))) return key;
	}
	return undefined;
}

function detectJornada(
	sheetName: string,
	sheet: ParsedSheet,
): number | undefined {
	const match = sheetName.match(/jornada\s+(\d+)/i);
	if (match) return parseInt(match[1]);

	for (const row of sheet.rows.slice(0, 5)) {
		for (const cell of row) {
			const m = cell.match(/jornada\s+(\d+)/i);
			if (m) return parseInt(m[1]);
		}
	}
	return undefined;
}

function detectZone(row: Record<string, unknown>): string | null {
	for (const val of Object.values(row)) {
		const v = String(val).trim().toUpperCase();
		if (["LIGUILLA", "COPA", "RECOPA"].includes(v)) return v;
	}
	return null;
}

function hasAnyValue(row: Record<string, unknown>): boolean {
	return Object.values(row).some(
		(v) => v !== "" && v !== null && v !== undefined,
	);
}

function str(v: unknown): string {
	return String(v ?? "").trim();
}

function num(v: unknown): number {
	const n = parseFloat(String(v ?? "0").replace(/[^0-9.-]/g, ""));
	return isNaN(n) ? 0 : Math.round(n);
}
