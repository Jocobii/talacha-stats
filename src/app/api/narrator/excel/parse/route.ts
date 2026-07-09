/**
 * POST /api/narrator/excel/parse
 *
 * Recibe un Excel (multipart/form-data, campo "file") y devuelve el grid crudo
 * (headers + filas) más el mapeo de columnas sugerido. Controlador delgado (§3.2):
 * valida la entrada y delega en la feature. Público — sin auth pero acotado por
 * EXCEL_LIMITS para protegerse de abuso.
 */

import { parseExcel, EXCEL_LIMITS } from "@/features/narrator-analysis";
import { apiSuccess, apiError } from "@/types";
import type { ParseExcelResult } from "@/entities/narrator";

export async function POST(request: Request) {
	const formData = await request.formData().catch(() => null);
	const file = formData?.get("file");
	const sheetIndex = parseSheetIndex(formData?.get("sheetIndex"));

	if (!(file instanceof File)) return apiError("Falta el archivo (campo 'file')", 400);
	if (file.size === 0) return apiError("El archivo está vacío", 400);
	if (file.size > EXCEL_LIMITS.maxFileBytes) return apiError("El archivo es demasiado grande", 413);
	if (!hasAllowedExtension(file.name))
		return apiError("Solo se aceptan archivos .xlsx o .xls", 415);

	try {
		const buffer = await file.arrayBuffer();
		const result = await parseExcel(buffer, sheetIndex);
		const dataRows = result.grid.length - result.headerRowIndex - 1;
		if (dataRows <= 0) return apiError("No se encontraron filas de datos en el Excel", 422);
		return apiSuccess<ParseExcelResult>(result);
	} catch (caughtError) {
		console.error("[narrator/excel/parse]", caughtError);
		return apiError("No se pudo leer el archivo de Excel", 422);
	}
}

function hasAllowedExtension(name: string): boolean {
	const lower = name.toLowerCase();
	return EXCEL_LIMITS.allowedExtensions.some((ext) => lower.endsWith(ext));
}

/** `sheetIndex` es opcional (form field como string); si falta o es inválido, undefined → última hoja. */
function parseSheetIndex(raw: FormDataEntryValue | null | undefined): number | undefined {
	if (typeof raw !== "string" || raw.trim() === "") return undefined;
	const n = Number(raw);
	return Number.isInteger(n) ? n : undefined;
}
