/**
 * POST /api/narrator/excel/analyze
 *
 * Recibe el grid + mapeo + par de equipos elegidos y devuelve el NarratorAnalysis.
 * Controlador delgado (§3.2): valida con Zod, delega en la feature (pura) y
 * registra el uso del módulo (métrica) fire-and-forget.
 *
 * El cliente reenvía el grid para mantener el server stateless (flujo público).
 */

import {
	normalizeStandings,
	buildInputFromExcel,
	computeNarratorAnalysis,
} from "@/features/narrator-analysis";
import { AnalyzeExcelRequestSchema, recordNarratorAnalysis } from "@/entities/narrator";
import type { NarratorAnalysis } from "@/entities/narrator";
import { apiSuccess, apiError } from "@/types";

const VISITOR_COOKIE = "visitor_id";

export async function POST(request: Request) {
	const body = await request.json().catch(() => null);
	const parsed = AnalyzeExcelRequestSchema.safeParse(body);
	if (!parsed.success) {
		return apiError(parsed.error.issues[0]?.message ?? "Solicitud inválida", 400);
	}

	const { rows, mapping, teamAId, teamBId, leagueName, season } = parsed.data;

	const standings = normalizeStandings(rows, mapping);
	const input = buildInputFromExcel({ standings, teamAId, teamBId, leagueName, season });
	if (!input) return apiError("No se encontraron ambos equipos en la tabla", 404);

	const analysis = computeNarratorAnalysis(input);

	// Métrica de uso — nunca debe romper la respuesta al usuario.
	recordNarratorAnalysis({
		source: "excel",
		teamAName: input.teamA.team.name,
		teamBName: input.teamB.team.name,
		leagueName,
		visitorId: readVisitorId(request),
	}).catch((caughtError) => console.error("[narrator/excel/analyze] métrica", caughtError));

	return apiSuccess<NarratorAnalysis>(analysis);
}

function readVisitorId(request: Request): string | null {
	const cookieHeader = request.headers.get("cookie") ?? "";
	const match = cookieHeader
		.split(";")
		.map((c) => c.trim().split("="))
		.find(([name]) => name === VISITOR_COOKIE);
	return match?.[1] ?? null;
}
