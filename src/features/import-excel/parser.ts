/**
 * features/import-excel/parser.ts
 *
 * Responsabilidad única: leer un Buffer de Excel y devolver tipos normalizados.
 * Sin DB, sin red, sin efectos secundarios — función pura sobre bytes.
 *
 * Exportaciones públicas:
 *   parseBulkBuffer(input)  → ParsedBulkImport
 *
 * Todo lo demás es privado a este módulo.
 */

import { readWorkbook, sheetToArrays, type ParsedSheet } from "@/shared/lib/excel";
import { sanitizeName } from "@/shared/lib/normalize";

// ---------------------------------------------------------------------------
// Tipos públicos
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

export type ColumnMap = Record<string, string>;

export type MappedImportOptions = {
	type: BulkImportType;
	sheetName?: string;
	headerRow: number;
	columnMap: ColumnMap;
	jornada?: number;
};

export type ParserInput = {
	buffer: Buffer;
	options?: MappedImportOptions;
	/**
	 * Nombre exacto del tab seleccionado por el usuario en la UI.
	 * Tiene prioridad máxima sobre preferredJornada.
	 */
	preferredSheetName?: string;
	/**
	 * Cuando el usuario especifica una jornada, se usa como hint para
	 * seleccionar el sheet cuyo nombre coincida (ej: "Jornada 3").
	 * Solo aplica si preferredSheetName no está definido.
	 */
	preferredJornada?: number;
};

// ---------------------------------------------------------------------------
// Error tipado del parser
// ---------------------------------------------------------------------------

export class ParseError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "ParseError";
	}
}

// ---------------------------------------------------------------------------
// API pública
// ---------------------------------------------------------------------------

/**
 * Parsea un buffer de archivo .xlsx y retorna los datos normalizados.
 *
 * Si se pasa `options` (MappedImportOptions), usa el mapeo de columnas explícito.
 * Si no, intenta auto-detectar el tipo y las columnas.
 *
 * @throws ParseError si el archivo no tiene un formato reconocible.
 */
export async function parseBulkBuffer(input: ParserInput): Promise<ParsedBulkImport> {
	const workbook = await readWorkbook(input.buffer);

	if (input.options) {
		return parseMapped(workbook, input.options);
	}
	return parseAuto(workbook, input.preferredSheetName, input.preferredJornada);
}

// ---------------------------------------------------------------------------
// Parser con mapeo manual de columnas
// ---------------------------------------------------------------------------

async function parseMapped(
	workbook: Awaited<ReturnType<typeof readWorkbook>>,
	options: MappedImportOptions,
): Promise<ParsedBulkImport> {
	const sheetName = options.sheetName ?? workbook.sheetNames[0];
	const sheet = workbook.sheets[sheetName];
	if (!sheet) throw new ParseError(`Hoja "${sheetName}" no encontrada en el archivo.`);

	const allRows = sheetToArrays(sheet);
	const dataRows = allRows
		.slice(options.headerRow + 1)
		.filter((row) => row.some((cell) => cell !== ""));

	const map = options.columnMap;

	function getCell(row: string[], field: string): string {
		const idx = map[field];
		if (idx === undefined) return "";
		const i = parseInt(idx, 10);
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
				matchesPlayed:
					map.matchesPlayed !== undefined ? num(getCell(row, "matchesPlayed")) : undefined,
			});
		}
		return { type: "goleadores", rows, jornada: options.jornada };
	}

	// standings
	const rows: StandingsRow[] = [];
	let pos = 1;
	for (const row of dataRows) {
		const teamName = sanitizeName(getCell(row, "teamName"));
		if (!teamName) continue;
		if (ZONE_LABELS.has(teamName)) continue;
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

// ---------------------------------------------------------------------------
// Parser automático (auto-detect)
// ---------------------------------------------------------------------------

function parseAuto(
	workbook: Awaited<ReturnType<typeof readWorkbook>>,
	preferredSheetName?: string,
	preferredJornada?: number,
): ParsedBulkImport {
	// Prioridad de selección de sheet:
	// 1. Nombre exacto seleccionado por el usuario en la UI
	// 2. Tab cuyo nombre matchea "Jornada N" con la jornada especificada
	// 3. Primer sheet con datos válidos (comportamiento por defecto)
	let sheetNames: string[];
	if (preferredSheetName && workbook.sheetNames.includes(preferredSheetName)) {
		// Poner el sheet seleccionado primero; el resto como fallback
		sheetNames = [
			preferredSheetName,
			...workbook.sheetNames.filter((s) => s !== preferredSheetName),
		];
	} else if (preferredJornada !== undefined) {
		sheetNames = [...workbook.sheetNames].sort((a) => {
			const sheet = workbook.sheets[a];
			const jornada = detectJornada(a, sheet);
			return jornada === preferredJornada ? -1 : 1;
		});
	} else {
		sheetNames = workbook.sheetNames;
	}

	for (const sheetName of sheetNames) {
		const sheet = workbook.sheets[sheetName];
		if (sheet.rows.length === 0) continue;

		const jornada = detectJornada(sheetName, sheet);

		// Buscar la fila real de encabezados (puede haber filas de metadata antes)
		const headerRowIdx = findHeaderRowIndex(sheet);
		const rows = sheetToObjectsFrom(sheet, headerRowIdx);
		if (rows.length === 0) continue;

		const goleadores = tryParseGoleadores(rows, jornada);
		if (goleadores) return goleadores;

		const standings = tryParseStandings(rows, jornada);
		if (standings) return standings;
	}

	throw new ParseError("No se reconoció ningún formato válido en el archivo.");
}

// ---------------------------------------------------------------------------
// Intentos internos de parseo
// ---------------------------------------------------------------------------

function tryParseGoleadores(
	rows: Record<string, string>[],
	jornada?: number,
): ParsedBulkImport | null {
	const sample = rows.find(hasAnyValue);
	if (!sample) return null;

	const keys = Object.keys(sample);
	const nameCol = findCol(keys, ["nombre de jugador", "nombre", "jugador", "player"]);
	const goalsCol = findCol(keys, ["goles", "goals", "gls"]);
	if (!nameCol || !goalsCol) return null;

	const teamCol = findCol(keys, ["equipo", "team", "club"]);
	const assistsCol = findCol(keys, ["asistencias", "assists", "ast", "a"]);
	const yellowCol = findCol(keys, ["amarillas", "yellow", "ta"]);
	const redCol = findCol(keys, ["rojas", "red", "tr"]);
	const playedCol = findCol(keys, ["partidos", "jugados", "pj", "jj"]);

	const result: GoleadoresRow[] = [];

	for (const row of rows) {
		const rawName = sanitizeName(str(row[nameCol]));
		if (!rawName) continue;
		// filtrar filas que son encabezados repetidos o números solos
		if (rawName.includes("nombre") || rawName.includes("jugador")) continue;
		if (/^\d+$/.test(rawName)) continue;

		result.push({
			rawName,
			teamName: teamCol ? sanitizeName(str(row[teamCol])) : "",
			goals: num(row[goalsCol]),
			assists: assistsCol ? num(row[assistsCol]) : undefined,
			yellowCards: yellowCol ? num(row[yellowCol]) : undefined,
			redCards: redCol ? num(row[redCol]) : undefined,
			matchesPlayed: playedCol ? num(row[playedCol]) : undefined,
		});
	}

	if (result.length === 0) return null;
	return { type: "goleadores", rows: result, jornada };
}

function tryParseStandings(
	rows: Record<string, string>[],
	jornada?: number,
): ParsedBulkImport | null {
	const sample = rows.find(hasAnyValue);
	if (!sample) return null;

	const keys = Object.keys(sample);
	const teamCol = findCol(keys, ["equipo", "team", "club", "nombre"]);
	const ptsCol = findCol(keys, ["pts", "puntos", "points", "ptos"]);
	if (!teamCol || !ptsCol) return null;

	const playedCol = findCol(keys, ["jj", "pj", "jugados", "played", "gp"]);
	const winsCol = findCol(keys, ["jg", "ganados", "wins", "won", "w", "g"]);
	const drawsCol = findCol(keys, ["je", "empatados", "draws", "drawn", "d", "e"]);
	const lossesCol = findCol(keys, ["jp", "perdidos", "losses", "lost", "l", "p"]);
	const gfCol = findCol(keys, ["gf", "goles a favor", "goals for", "for"]);
	const gcCol = findCol(keys, ["gc", "goles en contra", "goals against", "against"]);

	const result: StandingsRow[] = [];
	let pos = 1;

	for (const row of rows) {
		const teamName = sanitizeName(str(row[teamCol]));
		if (!teamName) continue;
		if (STANDINGS_SKIP.has(teamName)) continue;

		result.push({
			position: pos++,
			teamName,
			played: playedCol ? num(row[playedCol]) : 0,
			wins: winsCol ? num(row[winsCol]) : 0,
			draws: drawsCol ? num(row[drawsCol]) : 0,
			losses: lossesCol ? num(row[lossesCol]) : 0,
			goalsFor: gfCol ? num(row[gfCol]) : 0,
			goalsAgainst: gcCol ? num(row[gcCol]) : 0,
			points: num(row[ptsCol]),
			zone: detectZone(row) ?? undefined,
		});
	}

	if (result.length < 2) return null;
	return { type: "standings", rows: result, jornada };
}

// ---------------------------------------------------------------------------
// Helpers privados
// ---------------------------------------------------------------------------

const ZONE_LABELS = new Set(["liguilla", "copa", "recopa"]);
const STANDINGS_SKIP = new Set(["equipo", "team", "liguilla", "copa", "recopa", "zona"]);

// Palabras clave que indican que una fila ES la cabecera de la tabla
const KNOWN_HEADER_WORDS = [
	"jugador",
	"player",
	"nombre",
	"equipo",
	"team",
	"club",
	"goles",
	"goals",
	"gls",
	"pts",
	"puntos",
	"points",
	"asistencias",
	"assists",
];

/**
 * Encuentra el índice (0-based) de la fila que contiene los encabezados reales
 * de la tabla. Permite saltar filas de metadata como "Jornada 8" o títulos.
 * Busca en las primeras 10 filas. Devuelve 0 si no encuentra nada mejor.
 */
function findHeaderRowIndex(sheet: ParsedSheet): number {
	for (let i = 0; i < Math.min(sheet.rows.length, 10); i++) {
		const row = sheet.rows[i];
		const hasKnownHeader = row.some((cell) => {
			const c = cell.toLowerCase().trim();
			return KNOWN_HEADER_WORDS.some((h) => c === h || c.includes(h));
		});
		if (hasKnownHeader) return i;
	}
	return 0;
}

/**
 * Versión de sheetToObjects que permite elegir qué fila usar como encabezados.
 * Equivalente a sheetToObjects de shared/lib/excel pero con offset configurable.
 */
function sheetToObjectsFrom(sheet: ParsedSheet, headerRow: number): Record<string, string>[] {
	if (sheet.rows.length <= headerRow) return [];
	const headers = sheet.rows[headerRow].map((h) => h.trim());
	const out: Record<string, string>[] = [];
	for (let i = headerRow + 1; i < sheet.rows.length; i++) {
		const row = sheet.rows[i];
		if (!row.some((v) => v !== "")) continue; // saltar filas vacías
		const obj: Record<string, string> = {};
		headers.forEach((h, idx) => {
			if (h) obj[h] = row[idx] ?? "";
		});
		out.push(obj);
	}
	return out;
}

function findCol(keys: string[], candidates: string[]): string | undefined {
	const normalizedKeys = keys.map((k) => ({
		original: k,
		normalized: k.toLowerCase().trim(),
	}));

	// 1. MATCH EXACTO (🔥 aquí "g" solo matchea si la columna ES "g")
	for (const { original, normalized } of normalizedKeys) {
		if (candidates.includes(normalized)) {
			return original;
		}
	}

	// 2. MATCH POR PALABRA COMPLETA
	for (const { original, normalized } of normalizedKeys) {
		if (candidates.some((c) => new RegExp(`\\b${c}\\b`).test(normalized))) {
			return original;
		}
	}

	// 3. MATCH FLEXIBLE (último recurso)
	for (const { original, normalized } of normalizedKeys) {
		if (candidates.some((c) => normalized.includes(c))) {
			return original;
		}
	}

	return undefined;
}

function detectJornada(sheetName: string, sheet: ParsedSheet): number | undefined {
	const matchName = sheetName.match(/jornada\s+(\d+)/i);
	if (matchName) return parseInt(matchName[1], 10);

	for (const row of sheet.rows.slice(0, 5)) {
		for (const cell of row) {
			const m = cell.match(/jornada\s+(\d+)/i);
			if (m) return parseInt(m[1], 10);
		}
	}
	return undefined;
}

function detectZone(row: Record<string, string>): string | null {
	for (const val of Object.values(row)) {
		const v = val.trim().toUpperCase();
		if (["LIGUILLA", "COPA", "RECOPA"].includes(v)) return v;
	}
	return null;
}

function hasAnyValue(row: Record<string, string>): boolean {
	return Object.values(row).some((v) => v !== "" && v !== null && v !== undefined);
}

function str(v: unknown): string {
	return String(v ?? "").trim();
}

function num(v: unknown): number {
	const n = parseFloat(String(v ?? "0").replace(/[^0-9.-]/g, ""));
	return isNaN(n) ? 0 : Math.round(n);
}
