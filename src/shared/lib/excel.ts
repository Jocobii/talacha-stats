import ExcelJS from "exceljs";

export type ParsedSheet = {
	name: string;
	rows: string[][];
};

export type ParsedWorkbook = {
	sheetNames: string[];
	sheets: Record<string, ParsedSheet>;
};

export async function readWorkbook(buffer: Buffer): Promise<ParsedWorkbook> {
	const wb = new ExcelJS.Workbook();
	// ExcelJS acepta ArrayBuffer/Uint8Array; pasar el buffer.buffer del Buffer Node.
	await wb.xlsx.load(
		buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer,
	);

	const sheetNames: string[] = [];
	const sheets: Record<string, ParsedSheet> = {};

	for (const ws of wb.worksheets) {
		// Ignorar hojas ocultas — el usuario no las ve en Excel y no debe verlas en el importador
		if (ws.state === "hidden" || ws.state === "veryHidden") continue;

		sheetNames.push(ws.name);

		const rows: string[][] = [];
		// IMPORTANTE: actualColumnCount devuelve el CONTEO de columnas con datos,
		// no el índice de la última columna. Si hay datos en cols 2-11, da 10,
		// y el loop se detiene antes de leer la col 11 (ej: PTS.).
		// columnCount sí da el índice máximo del span real de la hoja.
		const lastCol = ws.columnCount || ws.actualColumnCount || 0;
		const lastRow = ws.rowCount || ws.actualRowCount || 0;

		for (let r = 1; r <= lastRow; r++) {
			const row = ws.getRow(r);
			const arr: string[] = [];
			for (let c = 1; c <= lastCol; c++) {
				arr.push(cellToString(row.getCell(c).value));
			}
			if (arr.some((v) => v !== "")) rows.push(arr);
		}

		sheets[ws.name] = { name: ws.name, rows };
	}

	return { sheetNames, sheets };
}

export function sheetToArrays(sheet: ParsedSheet): string[][] {
	return sheet.rows;
}

export function sheetToObjects(sheet: ParsedSheet): Record<string, string>[] {
	if (sheet.rows.length === 0) return [];
	const headers = sheet.rows[0].map((h) => h.trim());
	const out: Record<string, string>[] = [];
	for (let i = 1; i < sheet.rows.length; i++) {
		const row = sheet.rows[i];
		const obj: Record<string, string> = {};
		headers.forEach((h, idx) => {
			if (h) obj[h] = row[idx] ?? "";
		});
		out.push(obj);
	}
	return out;
}

function cellToString(value: ExcelJS.CellValue): string {
	if (value == null) return "";
	if (typeof value === "string") return value.trim();
	if (typeof value === "number") return String(value);
	if (typeof value === "boolean") return String(value);
	if (value instanceof Date) {
		const iso = value.toISOString();
		return iso.split("T")[0];
	}
	if (typeof value === "object") {
		const v = value as unknown as Record<string, unknown>;
		if ("text" in v) return cellToString(v.text as ExcelJS.CellValue);
		if ("result" in v) return cellToString(v.result as ExcelJS.CellValue);
		if ("richText" in v && Array.isArray(v.richText)) {
			return (v.richText as Array<{ text?: unknown }>)
				.map((rt) => String(rt.text ?? ""))
				.join("")
				.trim();
		}
		if ("error" in v) return "";
		if ("hyperlink" in v && "text" in v)
			return cellToString((v as { text: ExcelJS.CellValue }).text);
	}
	return String(value).trim();
}
