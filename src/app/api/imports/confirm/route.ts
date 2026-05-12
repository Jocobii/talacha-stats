/**
 * POST /api/imports/confirm
 *
 * Persists the user's decisions from the preview step using the new
 * layer-based matching pipeline. Runs inside a single DB transaction.
 *
 * Body: application/json
 *   leagueId    string            UUID of the target league
 *   decisions   ImportDecision[]  Array of per-row decisions from the UI
 *   rowsById    Record<string, ParsedRow>  Row data keyed by rowId
 *   jornada?    number            Optional round number
 *
 * Response:
 *   { createdProfiles, updatedProfiles, claimsProposed, claimsAutoVerified, errors }
 */

import { confirmImportDecisions, ImportDecisionSchema } from "@/features/import-excel";
import { db } from "@/db";
import { leagues } from "@/db/schema";
import { eq } from "drizzle-orm";
import { apiSuccess, apiError } from "@/types";
import { z } from "zod";
import type { ParsedRow } from "@/features/import-excel";

// ---------------------------------------------------------------------------
// Input schema
// ---------------------------------------------------------------------------

const ParsedRowSchema = z.object({
	rawFullName: z.string(),
	normalizedName: z.string(),
	fingerprint: z.string(),
	alias: z.string().optional(),
	jerseyNumber: z.number().int().optional(),
	team: z.string(),
	goals: z.number().int().min(0),
	assists: z.number().int().min(0),
	yellowCards: z.number().int().min(0),
	redCards: z.number().int().min(0),
	matchesPlayed: z.number().int().min(0),
	jornada: z.number().int().optional(),
});

const ConfirmBodySchema = z.object({
	leagueId: z.string().uuid("leagueId debe ser un UUID válido"),
	decisions: z.array(ImportDecisionSchema).min(1, "Se requiere al menos una decisión"),
	rowsById: z.record(z.string(), ParsedRowSchema),
	jornada: z.number().int().positive().optional(),
});

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return apiError("Se esperaba application/json", 400);
	}

	const parsed = ConfirmBodySchema.safeParse(body);
	if (!parsed.success) {
		return apiError("Cuerpo inválido: " + parsed.error.issues[0].message, 400);
	}

	const { leagueId, decisions, rowsById, jornada } = parsed.data;

	// Resolve league → organizationId
	const league = await db.query.leagues.findFirst({
		where: eq(leagues.id, leagueId),
		columns: { id: true, organizationId: true },
	});
	if (!league) return apiError("Liga no encontrada", 404);

	// Build the Map<rowId, ParsedRow> from the plain object the client sent
	const rowsByIdMap = new Map<string, ParsedRow>(Object.entries(rowsById) as [string, ParsedRow][]);

	// Validate that every decision references a known rowId
	const unknownIds = decisions.map((d) => d.rowId).filter((id) => !rowsByIdMap.has(id));
	if (unknownIds.length > 0) {
		return apiError(`rowId desconocido(s) en decisions: ${unknownIds.slice(0, 3).join(", ")}`, 400);
	}

	try {
		const result = await confirmImportDecisions({
			leagueId,
			organizationId: league.organizationId!,
			autoResolved: [], // auto-resolved rows are already persisted by the preview caller; client sends explicit decisions only
			decisions,
			rowsById: rowsByIdMap,
			jornada,
		});

		return apiSuccess(result);
	} catch (e) {
		console.error("[imports/confirm] Error en transacción:", e);
		// Extraer el mensaje legible: Drizzle envuelve el error de PG en e.message,
		// que puede ser muy largo. Preferir e.cause.message (el error real de PostgreSQL).
		const pgMessage =
			e instanceof Error && (e as { cause?: { message?: string } }).cause?.message
				? (e as { cause?: { message?: string } }).cause!.message!
				: e instanceof Error
					? e.message
					: "Error al confirmar la importación";
		const message = pgMessage.replace(/\n[\s\S]*/m, "").trim(); // solo la primera línea
		return apiError(message, 500);
	}
}
