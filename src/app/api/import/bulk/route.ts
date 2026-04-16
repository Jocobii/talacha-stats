import {
	parseBulkExcel,
	parseBulkExcelMapped,
	generateBulkPreview,
	confirmBulkImport,
	type MappedImportOptions,
} from "@/lib/excel-import-bulk";
import { apiSuccess, apiError } from "@/types";
import { z } from "zod";

const MappedOptionsSchema = z.object({
	type: z.enum(["goleadores", "standings"]),
	sheetName: z.string().optional(),
	headerRow: z.number().int().min(0),
	columnMap: z.record(z.string(), z.string()),
	jornada: z.number().int().optional(),
});

// POST /api/import/bulk
// Si se envía "mapping" (JSON con MappedImportOptions) usa el mapeo manual.
// Si no, intenta auto-detección como fallback.
export async function POST(request: Request) {
	const formData = await request.formData().catch(() => null);
	if (!formData) return apiError("Se esperaba multipart/form-data", 400);

	const action = (formData.get("action") as string) || "preview";
	const leagueId = formData.get("league_id") as string;
	if (!leagueId) return apiError("Falta league_id", 400);

	const file = formData.get("file") as File | null;
	if (!file) return apiError("Falta el archivo Excel", 400);

	const buffer = Buffer.from(await file.arrayBuffer());

	// Leer mapping si viene
	const rawMapping = formData.get("mapping") as string | null;
	let mappingOptions: MappedImportOptions | null = null;

	if (rawMapping) {
		let raw: unknown;
		try {
			raw = JSON.parse(rawMapping);
		} catch {
			return apiError("JSON de mapping inválido", 400);
		}
		const r = MappedOptionsSchema.safeParse(raw);
		if (!r.success)
			return apiError("Mapping inválido: " + r.error.message, 400);
		mappingOptions = r.data;
	}

	let parsed;
	try {
		parsed = mappingOptions
			? parseBulkExcelMapped(buffer, mappingOptions)
			: parseBulkExcel(buffer);
	} catch (e: unknown) {
		return apiError(
			e instanceof Error ? e.message : "No se pudo parsear el archivo",
			400,
		);
	}

	if (action === "preview") {
		const preview = await generateBulkPreview(parsed, leagueId);
		return apiSuccess(preview);
	}

	if (action === "confirm") {
		let playerResolutions: Record<string, string> = {};
		const rawRes = formData.get("resolutions") as string | null;
		if (rawRes) {
			let raw: unknown;
			try {
				raw = JSON.parse(rawRes);
			} catch {
				return apiError("JSON de resoluciones inválido", 400);
			}
			const r = z.record(z.string(), z.string()).safeParse(raw);
			if (!r.success) return apiError("Formato de resoluciones inválido", 400);
			playerResolutions = r.data;
		}

		// Filtrar filas excluidas por el usuario en la vista previa
		const rawExclude = formData.get("exclude_rows") as string | null;
		if (rawExclude) {
			let excludeKeys: unknown;
			try {
				excludeKeys = JSON.parse(rawExclude);
			} catch {
				/* ignorar */
			}
			if (Array.isArray(excludeKeys)) {
				// Las keys tienen formato "g:{index}:{nombre}" o "s:{index}:{nombre}"
				const excludedIndices = new Set(
					excludeKeys
						.map((k: unknown) => {
							const parts = String(k).split(":");
							return parts.length >= 2 ? parseInt(parts[1], 10) : -1;
						})
						.filter((n) => n >= 0),
				);
				if (excludedIndices.size > 0) {
					parsed = {
						...parsed,
						rows: parsed.rows.filter((_, i) => !excludedIndices.has(i)),
					};
				}
			}
		}

		const result = await confirmBulkImport({
			leagueId,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			parsed: parsed as any,
			playerResolutions,
		});
		return apiSuccess(result);
	}

	return apiError("action debe ser 'preview' o 'confirm'", 400);
}
