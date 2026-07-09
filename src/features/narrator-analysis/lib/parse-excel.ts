/**
 * features/narrator-analysis/lib/parse-excel.ts
 *
 * Lectura del Excel con exceljs. SOLO server (depende de Node/exceljs).
 * Devuelve el grid crudo (headers + filas como texto) y el mapeo sugerido.
 *
 * No asume estructura: detecta la fila de encabezados como la primera con ≥2
 * celdas no vacías y toma las siguientes como datos. Respeta los límites de
 * `EXCEL_LIMITS` para protegerse en un endpoint público.
 *
 * Libros con varias hojas (p.ej. una por jornada): por defecto parseamos la
 * ÚLTIMA hoja (la jornada más reciente), pero el caller puede pedir otra vía
 * `sheetIndex` — el cliente ofrece un selector para cambiarla sin re-subir.
 */

import ExcelJS from "exceljs";
import type { ParseExcelResult } from "@/entities/narrator/model";
import { EXCEL_LIMITS } from "../constants";
import { detectColumns } from "./detect-columns";

export async function parseExcel(
	buffer: ArrayBuffer,
	sheetIndex?: number,
): Promise<ParseExcelResult> {
	const workbook = new ExcelJS.Workbook();
	await workbook.xlsx.load(buffer);

	// Solo hojas VISIBLES — las ocultas/veryHidden no aparecen en las pestañas de
	// Excel para el usuario, así que tampoco deberían aparecer en nuestro selector
	// (mismo criterio: "lo que ve en su Excel es lo que ve aquí").
	const worksheets = workbook.worksheets.filter((ws) => ws.state === "visible" || !ws.state);

	const sheetNames = worksheets.map((ws) => ws.name);
	if (sheetNames.length === 0) throw new Error("El archivo no tiene hojas de cálculo visibles");

	const isExplicitChoice = sheetIndex !== undefined && Number.isInteger(sheetIndex);
	const startIndex = resolveSheetIndex(sheetIndex, sheetNames.length);
	const startWorksheet = worksheets[startIndex];
	if (!startWorksheet) throw new Error("El archivo no tiene hojas de cálculo visibles");

	// Si el índice viene explícito (el usuario lo eligió en el selector), respetamos
	// esa hoja aunque esté vacía — el error se lo atribuimos a su elección. Si es el
	// default (última hoja), a veces esa última pestaña es una plantilla en blanco;
	// bajamos hacia atrás hasta encontrar la última hoja CON datos.
	const { grid, selectedSheetIndex } = isExplicitChoice
		? { grid: readGrid(startWorksheet), selectedSheetIndex: startIndex }
		: findLastNonEmptySheet(worksheets, startIndex);

	if (grid.length === 0) throw new Error("El archivo está vacío");

	// Devolvemos la matriz completa y SOLO adivinamos la fila de encabezados.
	// El cliente deja al usuario corregirla si nos equivocamos (sin re-subir).
	const guessed = findHeaderRowIndex(grid);
	const headerRowIndex = guessed === -1 ? 0 : guessed;

	return {
		grid,
		headerRowIndex,
		suggestedMapping: detectColumns(grid[headerRowIndex] ?? []),
		sheetNames,
		selectedSheetIndex,
	};
}

/** Sin índice pedido (o inválido) → última hoja del libro (la jornada más reciente). */
function resolveSheetIndex(sheetIndex: number | undefined, sheetCount: number): number {
	if (sheetIndex === undefined || !Number.isInteger(sheetIndex)) return sheetCount - 1;
	if (sheetIndex < 0 || sheetIndex >= sheetCount) return sheetCount - 1;
	return sheetIndex;
}

/**
 * Busca hacia atrás desde `startIndex` la última hoja que tenga al menos una
 * fila con datos. Cubre el caso común de una pestaña final en blanco (plantilla
 * o "resumen" vacío) que no debería ganarle a la última jornada real.
 */
function findLastNonEmptySheet(
	worksheets: ExcelJS.Worksheet[],
	startIndex: number,
): { grid: string[][]; selectedSheetIndex: number } {
	for (let i = startIndex; i >= 0; i--) {
		const ws = worksheets[i];
		if (!ws) continue;
		const grid = readGrid(ws);
		if (grid.length > 0) return { grid, selectedSheetIndex: i };
	}
	// Ninguna hoja tiene datos: devolvemos [] sobre el índice de partida para
	// que el error ("El archivo está vacío") se reporte de forma consistente.
	return { grid: [], selectedSheetIndex: startIndex };
}

/** Lee la hoja como matriz de strings, acotando filas/columnas a los límites. */
function readGrid(worksheet: ExcelJS.Worksheet): string[][] {
	const grid: string[][] = [];
	const maxRowsToScan = EXCEL_LIMITS.maxRows + 20; // margen para encabezados/basura inicial

	worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
		if (rowNumber > maxRowsToScan) return;
		grid.push(rowToStrings(row));
	});

	return grid;
}

function rowToStrings(row: ExcelJS.Row): string[] {
	const cells: string[] = [];
	for (let col = 1; col <= EXCEL_LIMITS.maxColumns; col++) {
		cells.push(cellText(row.getCell(col)));
	}
	// Recorta columnas vacías al final para no arrastrar celdas fantasma
	while (cells.length > 0 && cells[cells.length - 1] === "") cells.pop();
	return cells;
}

function cellText(cell: ExcelJS.Cell): string {
	// `cell.text` puede TIRAR (no solo devolver undefined) en celdas de fórmula
	// cuyo resultado cacheado es null/error (p.ej. una fórmula que apunta a una
	// celda vacía, o un #N/A) — exceljs asume result no-nulo internamente.
	// Si truena, caemos a leer `cell.value` a mano.
	try {
		const text = cell?.text;
		if (text === null || text === undefined) return "";
		return typeof text === "string" ? text.trim() : String(text).trim();
	} catch {
		return valueToText(cell?.value);
	}
}

function valueToText(value: ExcelJS.CellValue): string {
	if (value === null || value === undefined) return "";
	if (value instanceof Date) return value.toISOString();
	if (typeof value === "object") {
		if ("richText" in value) {
			return value.richText
				.map((r) => r.text ?? "")
				.join("")
				.trim();
		}
		if ("result" in value) return valueToText(value.result as ExcelJS.CellValue);
		if ("text" in value) return valueToText((value as { text: ExcelJS.CellValue }).text);
		if ("error" in value) return String((value as { error: unknown }).error ?? "");
		return "";
	}
	return String(value).trim();
}

function findHeaderRowIndex(grid: string[][]): number {
	return grid.findIndex((row) => row.filter((c) => c !== "").length >= 2);
}
