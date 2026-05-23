import { z } from "zod";
import { generateNarratorAnalysis } from "@/lib/narrator";
import { apiSuccess, apiError } from "@/types";
import { parseQueryParams } from "@/shared/lib/query-filters";

const NarratorFiltersSchema = z.object({
	teamA: z.string().uuid({ message: "teamA debe ser un UUID valido" }),
	teamB: z.string().uuid({ message: "teamB debe ser un UUID valido" }),
	leagueId: z.string().uuid({ message: "leagueId debe ser un UUID valido" }),
});

// GET /api/narrator?teamA=uuid&teamB=uuid&leagueId=uuid
export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);

	const parsed = parseQueryParams(searchParams, NarratorFiltersSchema);
	if (!parsed.success) return apiError("Se requieren teamA, teamB y leagueId validos", 400);
	const { teamA, teamB, leagueId } = parsed.data;

	if (teamA === teamB) {
		return apiError("Los dos equipos deben ser diferentes", 400);
	}

	try {
		const analysis = await generateNarratorAnalysis(teamA, teamB, leagueId);
		if (!analysis) return apiError("No se encontraron los equipos o la liga", 404);
		return apiSuccess(analysis);
	} catch (e) {
		console.error("[narrator]", e);
		return apiError("Error al generar el analisis", 500);
	}
}
