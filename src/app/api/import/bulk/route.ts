/**
 * POST /api/import/bulk
 *
 * Controlador delgado — solo valida entrada, delega a features/import-excel.
 * Soporta dos acciones:
 *   action=preview → parsea + resuelve jugadores + detecta anomalías
 *   action=confirm → persiste en DB con batch inserts
 *
 * Si viene "mapping" (JSON MappedImportOptions) usa mapeo manual.
 * Si no, auto-detección de columnas.
 */

import {
	generatePreview,
	confirmImport,
	parseBulkBuffer,
	ParseError,
	type MappedImportOptions,
} from "@/features/import-excel";
import { apiSuccess, apiError } from "@/types";
import { z } from "zod";

const MappedOptionsSchema = z.object({
	type: z.enum(["goleadores", "standings"]),
	sheetName: z.string().optional(),
	headerRow: z.number().int().min(0),
	columnMap: z.record(z.string(), z.string()),
	jornada: z.number().int().optional(),
});

export async function POST(request: Request) {
	const formData = await request.formData().catch(() => null);
	if (!formData) return apiError("Se esperaba multipart/form-data", 400);

	const action = (formData.get("action") as string) || "preview";
	const leagueId = formData.get("league_id") as string;
	if (!leagueId) return apiError("Falta league_id", 400);

	const file = formData.get("file") as File | null;
	if (!file) return apiError("Falta el archivo Excel", 400);

	const buffer = Buffer.from(await file.arrayBuffer());

	// Parsear mapping opcional
	const options = parseMapping(formData);
	if (options instanceof Response) return options;

	try {
		if (action === "preview") {
			return apiSuccess(await generatePreview({ buffer, leagueId, options }));
		}

		if (action === "confirm") {
			let parsed = await parseBulkBuffer({ buffer, options });
			parsed = applyExcludeRows(parsed, formData);
			const resolutions = parseResolutions(formData);
			if (resolutions instanceof Response) return resolutions;
			return apiSuccess(
				await confirmImport({
					leagueId,
					parsed,
					playerResolutions: resolutions,
				}),
			);
		}
	} catch (e) {
		return apiError(e instanceof ParseError ? e.message : "No se pudo procesar el archivo", 400);
	}

	return apiError("action debe ser 'preview' o 'confirm'", 400);
}

// ---------------------------------------------------------------------------
// Helpers de parseo de form-data
// ---------------------------------------------------------------------------

function parseMapping(formData: FormData): MappedImportOptions | undefined | Response {
	const raw = formData.get("mapping") as string | null;
	if (!raw) return undefined;
	let parsed: unknown;
	try {
		parsed = JSON.parse(raw);
	} catch {
		return apiError("JSON de mapping inválido", 400);
	}
	const r = MappedOptionsSchema.safeParse(parsed);
	if (!r.success) return apiError("Mapping inválido: " + r.error.message, 400);
	return r.data;
}

function parseResolutions(formData: FormData): Record<string, string> | Response {
	const raw = formData.get("resolutions") as string | null;
	if (!raw) return {};
	let parsed: unknown;
	try {
		parsed = JSON.parse(raw);
	} catch {
		return apiError("JSON de resoluciones inválido", 400);
	}
	const r = z.record(z.string(), z.string()).safeParse(parsed);
	if (!r.success) return apiError("Formato de resoluciones inválido", 400);
	return r.data;
}

/**
 * Filtra las filas que el usuario excluyó en la vista previa.
 * Las keys tienen formato "g:{index}:{nombre}" o "s:{index}:{nombre}".
 */
function applyExcludeRows<T extends { rows: unknown[] }>(parsed: T, formData: FormData): T {
	const raw = formData.get("exclude_rows") as string | null;
	if (!raw) return parsed;
	let keys: unknown;
	try {
		keys = JSON.parse(raw);
	} catch {
		return parsed;
	}
	if (!Array.isArray(keys) || keys.length === 0) return parsed;
	const excluded = new Set(
		keys
			.map((k: unknown) => {
				const parts = String(k).split(":");
				return parts.length >= 2 ? parseInt(parts[1], 10) : -1;
			})
			.filter((n) => n >= 0),
	);
	return { ...parsed, rows: parsed.rows.filter((_, i) => !excluded.has(i)) };
}
