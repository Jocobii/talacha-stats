import { generateNarratorAnalysis } from "@/lib/narrator";
import { apiSuccess, apiError } from "@/types";

// GET /api/narrator?teamA=uuid&teamB=uuid&leagueId=uuid
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const teamA = searchParams.get("teamA");
  const teamB = searchParams.get("teamB");
  const leagueId = searchParams.get("leagueId");

  if (!teamA || !teamB || !leagueId) {
    return apiError("Se requieren teamA, teamB y leagueId", 400);
  }
  if (teamA === teamB) {
    return apiError("Los dos equipos deben ser diferentes", 400);
  }

  try {
    const analysis = await generateNarratorAnalysis(teamA, teamB, leagueId);
    if (!analysis) return apiError("No se encontraron los equipos o la liga", 404);
    return apiSuccess(analysis);
  } catch (e) {
    console.error("[narrator]", e);
    return apiError("Error al generar el análisis", 500);
  }
}
