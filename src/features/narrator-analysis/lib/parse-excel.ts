/**
 * features/narrator-analysis/lib/parse-excel.ts
 *
 * Lectura del Excel con exceljs. SOLO server (depende de Node/exceljs).
 * Devuelve el grid crudo (headers + filas como texto) y el mapeo sugerido.
 *
 * No asume estructura: detecta la fila de encabezados como la primera con ≥2
 * celdas no vacías y toma las siguientes como datos. Respeta los límites de
 * `EXCEL_LIMITS` para protegerse en un endpoint público.
 */

import ExcelJS from "exceljs";
import type { ParseExcelResult } from "@/entities/narrator/model";
import { EXCEL_LIMITS } from "../constants";
import { detectColumns } from "./detect-columns";

export async function parseExcel(buffer: ArrayBuffer): Promise<ParseExcelResult> {
	const workbook = new ExcelJS.Workbook();
	await workbook.xlsx.load(buffer);

	const worksheet = workbook.worksheets[0];
	if (!worksheet) throw new Error("El archivo no tiene hojas de cálculo");

	const grid = readGrid(worksheet);
	if (grid.length === 0) throw new Error("El archivo está vacío");

	// Devolvemos la matriz completa y SOLO adivinamos la fila de encabezados.
	// El cliente deja al usuario corregirla si nos equivocamos (sin re-subir).
	const guessed = findHeaderRowIndex(grid);
	const headerRowIndex = guessed === -1 ? 0 : guessed;

	return {
		grid,
		headerRowIndex,
		suggestedMapping: detectColumns(grid[headerRowIndex] ?? []),
	};
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
	const text = cell?.text ?? "";
	return typeof text === "string" ? text.trim() : String(text).trim();
}

function findHeaderRowIndex(grid: string[][]): number {
	return grid.findIndex((row) => row.filter((c) => c !== "").length >= 2);
}
