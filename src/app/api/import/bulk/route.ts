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
 *
 * ⚠️  Goleadores: Para el flujo nuevo con matching por capas (L1-L4),
 *     usar /api/imports/preview y /api/imports/confirm en su lugar.
 *     Este endpoint sigue gestionando standings y el flujo legacy de goleadores.
 */

import {
	generatePreview,
	confirmImport,
	parseBulkBuffer,
	ParseError,
	type MappedImportOptions,
} from "@/features/import-excel";
import { generateJornadaPills } from "@/features/post-import-content";
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

	// Detect import type to route goleadores to the new pipeline
	const importType = options?.type ?? detectTypeFromFormData(formData);

	try {
		if (action === "preview") {
			// Standings: use legacy preview engine
			if (importType === "standings") {
				return apiSuccess(await generatePreview({ buffer, leagueId, options }));
			}

			// Goleadores legacy: usar el engine antiguo para el wizard clásico.
			// El nuevo engine (L1-L4) se accede desde /api/imports/preview.
			return apiSuccess(await generatePreview({ buffer, leagueId, options }));
		}

		if (action === "confirm") {
			// Standings: use legacy confirm engine
			if (importType === "standings") {
				let parsed = await parseBulkBuffer({ buffer, options });
				parsed = applyExcludeRows(parsed, formData);
				const resolutions = parseResolutions(formData);
				if (resolutions instanceof Response) return resolutions;

				const result = await confirmImport({
					leagueId,
					parsed,
					playerResolutions: resolutions,
				});

				const jornada = parsed.jornada ?? null;
				const content =
					jornada != null
						? {
								jornada,
								pills: await generateJornadaPills(leagueId, jornada),
								imageUrl: `/api/content/jornada-image?leagueId=${leagueId}&jornada=${jornada}&type=standings`,
							}
						: null;

				return apiSuccess({ ...result, content });
			}

			// Goleadores confirm: clients should use /api/imports/confirm directly.
			// We keep legacy behaviour here for backwards-compat.
			let parsed = await parseBulkBuffer({ buffer, options });
			parsed = applyExcludeRows(parsed, formData);
			const resolutions = parseResolutions(formData);
			if (resolutions instanceof Response) return resolutions;

			const result = await confirmImport({
				leagueId,
				parsed,
				playerResolutions: resolutions,
			});

			const jornada = parsed.jornada ?? null;
			const content =
				jornada != null
					? {
							jornada,
							pills: await generateJornadaPills(leagueId, jornada),
							imageUrl: `/api/content/jornada-image?leagueId=${leagueId}&jornada=${jornada}&type=goleadores`,
						}
					: null;

			return apiSuccess({ ...result, content });
		}
	} catch (e) {
		return apiError(e instanceof ParseError ? e.message : "No se pudo procesar el archivo", 400);
	}

	return apiError("action debe ser 'preview' o 'confirm'", 400);
}

// ---------------------------------------------------------------------------
// Helpers de parseo de form-data
// ------------------