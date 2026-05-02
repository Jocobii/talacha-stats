/**
 * features/import-excel/column-mapper.ts
 *
 * Funciones puras para detectar y mapear automáticamente las columnas
 * de un archivo Excel a los campos del dominio.
 *
 * Sin side effects — no tocan DOM, DB, ni red.
 * Testeables directamente con vitest (ver __tests__/column-mapper.test.ts).
 *
 * Exports:
 *   guessHeaderRow   → encuentra la fila más probable de encabezados
 *   autoMapColumns   → construye un mapa campo→índice de columna automáticamente
 *   normalizeCell    → normaliza un string para comparación (mayúsculas, sin tildes)
 */

import type { BulkImportType, ColumnMap } from "./parser";

// ---------------------------------------------------------------------------
// Patrones de detección por tipo de importación
// ---------------------------------------------------------------------------

/**
 * Palabras clave por campo para cada tipo de importación.
 * El orden dentro de cada array importa: se prueban de izquierda a derecha
 * y se prefieren coincidencias exactas sobre parciales.
 */
const COLUMN_PATTERNS: Record<BulkImportType, Record<string, string[]>> = {
	goleadores: {
		rawName: ["NOMBRE", "JUGADOR", "PLAYER", "NOMBRE DE JUGADOR", "NOMBRE DEL JUGADOR"],
		teamName: ["EQUIPO", "TEAM", "CLUB"],
		goals: ["GOLES", "GOL", "GOALS", "G"],
		assists: ["ASISTENCIAS", "ASISTENCIA", "AST", "ASSISTS", "A"],
		yellowCards: ["AMARILLAS", "AMARILLA", "YELLOW", "TA"],
		redCards: ["ROJAS", "ROJA", "RED", "TR"],
		matchesPlayed: ["PARTIDOS", "JJ", "PJ", "PLAYED", "MATCHES", "PARTIDOS JUGADOS"],
	},
	standings: {
		teamName: ["EQUIPO", "TEAM", "CLUB"],
		played: ["JJ", "PJ", "PARTIDOS JUGADOS", "PLAYED", "PARTIDOS"],
		wins: ["JG", "GANADOS", "WINS", "W", "VICTORIAS"],
		draws: ["JE", "EMPATES", "DRAWS", "D", "EMPATE"],
		losses: ["JP", "PERDIDOS", "LOSSES", "DERROTAS", "DERROTA"],
		goalsFor: ["GF", "GOLES A FAVOR", "GOALS FOR", "FAVOR"],
		goalsAgainst: ["GC", "GOLES EN CONTRA", "GOALS AGAINST", "CONTRA"],
		points: ["PTS", "PUNTOS", "POINTS", "PT"],
	},
};

// ---------------------------------------------------------------------------
// API pública
// ---------------------------------------------------------------------------

/**
 * Normaliza un string de celda para comparación:
 * mayúsculas + sin tildes + sin espacios extremos.
 *
 * Es una función pura exportada para que los tests puedan verificar
 * el comportamiento de normalización de forma independiente.
 */
export function normalizeCell(s: string): string {
	return s
		.toUpperCase()
		.normalize("NFD")
		.replace(/[̀-ͯ]/g, "")
		.trim();
}

/**
 * Recorre las primeras filas del preview de Excel y devuelve el índice
 * de la fila que más probablemente contiene los encabezados.
 *
 * Heurística: la fila con mayor cantidad de celdas no vacías
 * (en las primeras 8 filas).
 */
export function guessHeaderRow(preview: string[][]): number {
	let bestRow = 0;
	let bestScore = 0;

	const limit = Math.min(preview.length, 8);

	for (let i = 0; i < limit; i++) {
		const nonEmpty = preview[i].filter((cell) => cell !== "").length;
		if (nonEmpty > bestScore) {
			bestScore = nonEmpty;
			bestRow = i;
		}
	}

	return bestRow;
}

/**
 * Genera automáticamente el mapa campo→índiceDeColumna comparando los
 * encabezados del Excel con los patrones conocidos para el tipo de importación.
 *
 * Estrategia de matching (en orden de prioridad):
 *   1. Coincidencia exacta normalizada
 *   2. Coincidencia parcial (el encabezado contiene la keyword, o viceversa)
 *
 * Cada columna solo se puede asignar a un campo (greedy, primera coincidencia gana).
 */
export function autoMapColumns(headerCols: string[], type: BulkImportType): ColumnMap {
	const patterns = COLUMN_PATTERNS[type];
	const map: ColumnMap = {};
	const usedCols = new Set<number>();

	for (const [field, keywords] of Object.entries(patterns)) {
		for (let ci = 0; ci < headerCols.length; ci++) {
			if (usedCols.has(ci)) continue;

			const cell = normalizeCell(headerCols[ci]);
			if (!cell) continue;

			const normalizedKeywords = keywords.map(normalizeCell);

			const exactMatch = normalizedKeywords.some((k) => k === cell);
			const partialMatch =
				!exactMatch &&
				normalizedKeywords.some((k) => cell.includes(k) || k.includes(cell));

			if (exactMatch || partialMatch) {
				map[field] = String(ci);
				usedCols.add(ci);
				break;
			}
		}
	}

	return map;
}
