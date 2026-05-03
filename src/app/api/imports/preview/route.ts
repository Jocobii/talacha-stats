/**
 * POST /api/imports/preview
 *
 * New import preview endpoint using the layer-based matching pipeline (L1-L4).
 * Replaces the goleadores preview path in /api/import/bulk.
 *
 * Body: multipart/form-data
 *   file        File    Excel file (.xlsx / .xls)
 *   league_id   string  UUID of the target league
 *   jornada?    string  Optional round number (integer as string)
 */

import { generateImportPreview } from "@/features/import-excel";
import { db } from "@/db";
import { leagues } from "@/db/schema";
import { eq } from "drizzle-orm";
import { apiSuccess, apiError } from "@/types";
import { z } from "zod";

const QuerySchema = z.object({
	league_id: z.string().uuid("league_id debe ser un UUID valido"),
	jornada: z
		.string()
		.regex(/^\d+$/, "jornada debe ser un numero entero")
		.transform(Number)
		.optional(),
});

export async function POST(request: Request) {
	const formData = await request.formData().catch(() => null);
	if (!formData) return apiError("Se esperaba multipart/form-data", 400);

	const leagueId = formData.get("league_id") as string | null;
	const jornadaRaw = formData.get("jornada") as string | null;

	const parsed = QuerySchema.safeParse({
		league_id: leagueId ?? undefined,
		jornada: jornadaRaw ?? undefined,
	});
	if (!parsed.success) return apiError(parsed.error.issues[0].message, 400);

	const { league_id, jornada } = parsed.data;

	// Resolve league -> organizationId
	const league = await db.query.leagues.findFirst({
		where: eq(leagues.id, league_id),
		columns: { id: true, organizationId: true },
	});
	if (!league) return apiError("Liga no encontrada", 404);

	const file = formData.get("file") as File | null;
	if (!file) return apiError("Falta el archivo Excel", 400);

	const buffer = Buffer.from(await file.arrayBuffer());

	try {
		const result = await generateImportPreview({
			buffer,
			leagueId: league_id,
			organizationId: league.organizationId!,
			jornada,
		});
		return apiSuccess(result);
	} catch (e) {
		const message = e instanceof Error ? e.message : "No se pudo procesar el archivo";
		return apiError(message, 400);
	}
}
