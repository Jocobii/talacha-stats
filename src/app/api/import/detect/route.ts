import { readWorkbook, sheetToArrays } from "@/shared/lib/excel";
import { apiSuccess, apiError } from "@/types";

export type DetectResult = {
	sheets: string[];
	activeSheet: string;
	// Primeras 10 filas como arrays de strings — para que el usuario vea el contenido
	preview: string[][];
	// Total de filas con datos
	totalRows: number;
};

// POST /api/import/detect
// Recibe un archivo Excel y devuelve las primeras filas para que el usuario
// pueda identificar en qué fila están los encabezados y mapear columnas.
export async function POST(request: Request) {
	const formData = await request.formData().catch(() => null);
	if (!formData) return apiError("Se esperaba multipart/form-data", 400);

	const file = formData.get("file") as File | null;
	if (!file) return apiError("Falta el archivo", 400);

	const sheetName = formData.get("sheet") as string | null;
	const jornadaRaw = formData.get("jornada") as string | null;
	const jornada = jornadaRaw ? parseInt(jornadaRaw, 10) : null;

	const buffer = Buffer.from(await file.arrayBuffer());

	let workbook;
	try {
		workbook = await readWorkbook(buffer);
	} catch {
		return apiError("No se pudo leer el archivo Excel", 400);
	}

	const sheets = workbook.sheetNames;

	// Prioridad: 1) nombre exacto enviado por el cliente, 2) tab cuyo nombre
	// matchea "Jornada N" con la jornada seleccionada, 3) primer sheet.
	let active: string;
	if (sheetName && sheets.includes(sheetName)) {
		active = sheetName;
	} else if (jornada !== null && !isNaN(jornada)) {
		const matched = sheets.find((s) => new RegExp(`jornada\\s*${jornada}\\b`, "i").test(s));
		active = matched ?? sheets[0];
	} else {
		active = sheets[0];
	}
	const sheet = workbook.sheets[active];

	// El wrapper ya filtra filas vacías y normaliza celdas a string
	const cleaned = sheetToArrays(sheet);

	const preview = cleaned.slice(0, 15); // primeras 15 filas para el preview

	return apiSuccess({
		sheets,
		activeSheet: active,
		preview,
		totalRows: cleaned.length,
	} satisfies DetectResult);
}
