import * as XLSX from "xlsx";
import {
	db,
	players,
	teams,
	playerSeasonStats,
	teamStandingsSnapshot,
	playerRegistrations,
} from "@/db";
import { ilike, or, eq, and } from "drizzle-orm";

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

export type PlayerResolution = {
	rawName: string;
	teamName: string;
	found: boolean;
	playerId?: string;
	candidates: { id: string; fullName: string; alias: string | null }[];
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

export type ColumnMap = Record<string, string>; // campo → índice de columna (letra o número 0-based)

export type MappedImportOptions = {
  type: BulkImportType;
  sheetName?: string;
  headerRow: number;         // índice 0-based de la fila con encabezados
  columnMap: ColumnMap;      // { rawName: "1", goals: "3", teamName: "2" }
  jornada?: number;
};

/**
 * Parsea un Excel usando un mapeo de columnas definido manualmente por el usuario.
 * headerRow: índice 0-based de la fila que contiene los encabezados (o -1 si no hay)
 * columnMap: { campo: índice_columna } donde índice_columna es 0-based (0=A, 1=B, ...)
 */
export function parseBulkExcelMapped(
  buffer: Buffer,
  options: MappedImportOptions,
): ParsedBulkImport {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = options.sheetName ?? workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  const allRows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: "",
    raw: false,
  });

  const cleaned: string[][] = allRows.map((row) =>
    (row as unknown[]).map((cell) => String(cell ?? "").trim()),
  );

  // Las filas de datos empiezan después de headerRow
  const dataRows = cleaned.slice(options.headerRow + 1).filter((row) =>
    row.some((cell) => cell !== ""),
  );

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
      const rawName = getCell(row, "rawName").trim();
      if (!rawName) continue;

      rows.push({
        rawName,
        teamName: getCell(row, "teamName"),
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
      const teamName = getCell(row, "teamName").trim();
      if (!teamName) continue;
      if (["liguilla", "copa", "recopa"].includes(teamName.toLowerCase())) continue;

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
// PARSER — detecta el tipo de Excel automáticamente (fallback)
// ---------------------------------------------------------------------------

export function parseBulkExcel(buffer: Buffer): ParsedBulkImport {
	const workbook = XLSX.read(buffer, { type: "buffer" });

	// Intentar cada hoja hasta encontrar datos reconocibles
	for (const sheetName of workbook.SheetNames) {
		const sheet = workbook.Sheets[sheetName];
		const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
			defval: "",
			raw: false,
		});

		if (rows.length === 0) continue;

		// Detectar jornada desde la hoja o nombre de sheet
		const jornada = detectJornada(sheetName, sheet);

		// Verificar si es formato GOLEADORES
		const goleadoresResult = tryParseGoleadores(rows, jornada);
		if (goleadoresResult) return goleadoresResult;

		// Verificar si es formato TABLA GENERAL / STANDINGS
		const standingsResult = tryParseStandings(rows, jornada);
		if (standingsResult) return standingsResult;
	}

	throw new Error("No se reconoció ningún formato válido en el archivo.");
}

// ---------------------------------------------------------------------------
// PARSER: Goleadores
// Detecta columnas: NOMBRE / JUGADOR + EQUIPO + GOLES
// ---------------------------------------------------------------------------

function tryParseGoleadores(
	rows: Record<string, unknown>[],
	jornada?: number,
): ParsedBulkImport | null {
	const sample = rows.find((r) => hasAnyValue(r));
	if (!sample) return null;

	const keys = Object.keys(sample);
	const nameCol = findCol(keys, [
		"NOMBRE DE JUGADOR",
		"nombre de jugador",
		"nombre",
		"jugador",
		"player",
	]);
	const teamCol = findCol(keys, ["equipo", "team", "club"]);
	const goalsCol = findCol(keys, ["goles", "goals", "gls", "g"]);

	if (!nameCol || !goalsCol) return null;

	const assistsCol = findCol(keys, ["asistencias", "assists", "ast", "a"]);
	const yellowCol = findCol(keys, ["amarillas", "yellow", "ta"]);
	const redCol = findCol(keys, ["rojas", "red", "tr"]);
	const playedCol = findCol(keys, ["partidos", "jugados", "pj", "jj"]);

	const result: GoleadoresRow[] = [];

	for (const row of rows) {
		const rawName = str(row[nameCol!]);
		const goals = num(row[goalsCol!]);

		// Saltar filas sin nombre o encabezados repetidos
		if (
			!rawName ||
			rawName.toLowerCase().includes("nombre") ||
			rawName.toLowerCase().includes("jugador")
		)
			continue;
		// Saltar filas numéricas puras (números de ranking)
		if (/^\d+$/.test(rawName)) continue;

		result.push({
			rawName,
			teamName: teamCol ? str(row[teamCol]) : "",
			goals,
			assists: assistsCol ? num(row[assistsCol]) : undefined,
			yellowCards: yellowCol ? num(row[yellowCol]) : undefined,
			redCards: redCol ? num(row[redCol]) : undefined,
			matchesPlayed: playedCol ? num(row[playedCol]) : undefined,
		});
	}

	if (result.length === 0) return null;

	return { type: "goleadores", rows: result, jornada };
}

// ---------------------------------------------------------------------------
// PARSER: Tabla general / Standings
// Detecta columnas: EQUIPO + JJ/PJ + JG/WON + JE/DRAWN + JP/LOST + GF + GC + PTS
// ---------------------------------------------------------------------------

function tryParseStandings(
	rows: Record<string, unknown>[],
	jornada?: number,
): ParsedBulkImport | null {
	const sample = rows.find((r) => hasAnyValue(r));
	if (!sample) return null;

	const keys = Object.keys(sample);
	const teamCol = findCol(keys, ["equipo", "team", "club", "nombre"]);
	const ptsCol = findCol(keys, ["pts", "puntos", "points", "ptos"]);

	if (!teamCol || !ptsCol) return null;

	const playedCol = findCol(keys, ["jj", "pj", "jugados", "played", "gp"]);
	const winsCol = findCol(keys, ["jg", "ganados", "wins", "won", "w", "g"]);
	const drawsCol = findCol(keys, [
		"je",
		"empatados",
		"draws",
		"drawn",
		"d",
		"e",
	]);
	const lossesCol = findCol(keys, [
		"jp",
		"perdidos",
		"losses",
		"lost",
		"l",
		"p",
	]);
	const gfCol = findCol(keys, ["gf", "goles a favor", "goals for", "for"]);
	const gcCol = findCol(keys, [
		"gc",
		"goles en contra",
		"goals against",
		"against",
	]);

	const result: StandingsRow[] = [];
	let pos = 1;

	for (const row of rows) {
		const teamName = str(row[teamCol!]);

		// Saltar filas sin equipo, encabezados repetidos, zonas (LIGUILLA, COPA)
		if (!teamName) continue;
		if (
			["equipo", "team", "liguilla", "copa", "recopa", "zona"].includes(
				teamName.toLowerCase(),
			)
		)
			continue;

		// Detectar zona de clasificación en columnas adyacentes o en el nombre
		const zone = detectZone(row);

		result.push({
			position: pos++,
			teamName,
			played: playedCol ? num(row[playedCol]) : 0,
			wins: winsCol ? num(row[winsCol]) : 0,
			draws: drawsCol ? num(row[drawsCol]) : 0,
			losses: lossesCol ? num(row[lossesCol]) : 0,
			goalsFor: gfCol ? num(row[gfCol]) : 0,
			goalsAgainst: gcCol ? num(row[gcCol]) : 0,
			points: num(row[ptsCol!]),
			zone: zone ?? undefined,
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

	if (parsed.type === "goleadores") {
		const rows = parsed.rows as GoleadoresRow[];
		const playerResolutions: PlayerResolution[] = [];

		for (const row of rows) {
			const normalized = `%${row.rawName.toLowerCase().trim()}%`;
			const found = await db.query.players.findMany({
				where: or(
					ilike(players.fullName, normalized),
					ilike(players.alias, normalized),
				),
				limit: 5,
			});

			if (found.length === 1) {
				playerResolutions.push({
					rawName: row.rawName,
					teamName: row.teamName,
					found: true,
					playerId: found[0].id,
					candidates: found.map((p) => ({
						id: p.id,
						fullName: p.fullName,
						alias: p.alias,
					})),
				});
			} else if (found.length > 1) {
				playerResolutions.push({
					rawName: row.rawName,
					teamName: row.teamName,
					found: false,
					candidates: found.map((p) => ({
						id: p.id,
						fullName: p.fullName,
						alias: p.alias,
					})),
				});
				warnings.push(
					`"${row.rawName}" tiene ${found.length} coincidencias — seleccionar manualmente.`,
				);
			} else {
				playerResolutions.push({
					rawName: row.rawName,
					teamName: row.teamName,
					found: false,
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

	// standings
	const rows = parsed.rows as StandingsRow[];
	const teamWarnings: string[] = [];

	for (const row of rows) {
		const existing = await db.query.teams.findFirst({
			where: and(ilike(teams.name, row.teamName), eq(teams.leagueId, leagueId)),
		});
		if (!existing)
			teamWarnings.push(
				`"${row.teamName}" no existe en la liga — se creará automáticamente.`,
			);
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
// ---------------------------------------------------------------------------

export async function confirmBulkImport(
	payload: BulkConfirmPayload,
): Promise<BulkImportResult> {
	const { leagueId, parsed, playerResolutions = {} } = payload;
	const warnings: string[] = [];
	let upserted = 0;
	let created = 0;

	if (parsed.type === "goleadores") {
		const rows = parsed.rows as GoleadoresRow[];

		for (const row of rows) {
			// 1. Resolver jugador
			let playerId = playerResolutions[row.rawName];

			if (!playerId || playerId === "NEW") {
				// Crear jugador nuevo
				const [newPlayer] = await db
					.insert(players)
					.values({ fullName: row.rawName })
					.returning();
				playerId = newPlayer.id;
				created++;
			}

			// 2. Resolver equipo (crear si no existe)
			let teamId: string | null = null;
			if (row.teamName) {
				const existingTeam = await db.query.teams.findFirst({
					where: and(
						ilike(teams.name, row.teamName),
						eq(teams.leagueId, leagueId),
					),
				});
				if (existingTeam) {
					teamId = existingTeam.id;
				} else {
					const [newTeam] = await db
						.insert(teams)
						.values({ name: row.teamName, leagueId })
						.returning();
					teamId = newTeam.id;
					created++;
				}
			}

			// 3. Registrar jugador en equipo si no está
			if (teamId) {
				await db
					.insert(playerRegistrations)
					.values({ playerId, teamId, leagueId })
					.onConflictDoNothing();
			}

			// 4. Upsert stats acumuladas
			await db
				.insert(playerSeasonStats)
				.values({
					playerId,
					leagueId,
					teamId,
					goals: row.goals,
					assists: row.assists ?? 0,
					yellowCards: row.yellowCards ?? 0,
					redCards: row.redCards ?? 0,
					matchesPlayed: row.matchesPlayed ?? 0,
					jornada: parsed.jornada ?? null,
					updatedAt: new Date(),
				})
				.onConflictDoUpdate({
					target: [playerSeasonStats.playerId, playerSeasonStats.leagueId],
					set: {
						goals: row.goals,
						assists: row.assists ?? 0,
						yellowCards: row.yellowCards ?? 0,
						redCards: row.redCards ?? 0,
						matchesPlayed: row.matchesPlayed ?? 0,
						jornada: parsed.jornada ?? null,
						updatedAt: new Date(),
						...(teamId ? { teamId } : {}),
					},
				});

			upserted++;
		}
	} else {
		// standings
		const rows = parsed.rows as StandingsRow[];

		for (const row of rows) {
			// Resolver o crear equipo
			let teamId: string;
			const existingTeam = await db.query.teams.findFirst({
				where: and(
					ilike(teams.name, row.teamName),
					eq(teams.leagueId, leagueId),
				),
			});

			if (existingTeam) {
				teamId = existingTeam.id;
			} else {
				const [newTeam] = await db
					.insert(teams)
					.values({ name: row.teamName, leagueId })
					.returning();
				teamId = newTeam.id;
				created++;
			}

			const jornada = parsed.jornada ?? 1;

			await db
				.insert(teamStandingsSnapshot)
				.values({
					teamId,
					leagueId,
					jornada,
					played: row.played,
					wins: row.wins,
					draws: row.draws,
					losses: row.losses,
					goalsFor: row.goalsFor,
					goalsAgainst: row.goalsAgainst,
					points: row.points,
					zone: row.zone ?? null,
					updatedAt: new Date(),
				})
				.onConflictDoUpdate({
					target: [
						teamStandingsSnapshot.teamId,
						teamStandingsSnapshot.leagueId,
						teamStandingsSnapshot.jornada,
					],
					set: {
						played: row.played,
						wins: row.wins,
						draws: row.draws,
						losses: row.losses,
						goalsFor: row.goalsFor,
						goalsAgainst: row.goalsAgainst,
						points: row.points,
						zone: row.zone ?? null,
						updatedAt: new Date(),
					},
				});

			upserted++;
		}
	}

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
	sheet: XLSX.WorkSheet,
): number | undefined {
	// Intentar desde el nombre del sheet: "JORNADA 13", "JORNADA 3 2026-1"
	const match = sheetName.match(/jornada\s+(\d+)/i);
	if (match) return parseInt(match[1]);

	// Intentar desde las primeras filas del sheet
	const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
		defval: "",
		header: 1,
	});

	for (const row of rows.slice(0, 5)) {
		for (const cell of row) {
			const m = String(cell).match(/jornada\s+(\d+)/i);
			if (m) return parseInt(m[1]);
		}
	}
	return undefined;
}

function detectZone(row: Record<string, unknown>): string | null {
	// Buscar en todas las columnas si hay una zona de clasificación
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
