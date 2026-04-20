import { getCityRanking, getLeagueRanking, getGlobalRanking } from "@/entities/player/ranking";
import { parsePaginationParams } from "@/shared/lib/pagination";
import { apiSuccessPaginated, apiError } from "@/types";
import { getRequestCity } from "@/shared/lib/active-city";

// GET /api/ranking?scope=city&city=Tijuana&page=1&limit=30
// GET /api/ranking?scope=league&leagueId=xxx&page=1&limit=30
// GET /api/ranking?scope=global&page=1&limit=30
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scope    = searchParams.get("scope") ?? "city";
  const leagueId = searchParams.get("leagueId");
  const pagination = parsePaginationParams(searchParams, { limit: 30 });

  if (scope === "league") {
    if (!leagueId) return apiError("Falta leagueId para scope=league", 400);
    const { items, meta } = await getLeagueRanking(leagueId, pagination);
    return apiSuccessPaginated(items, meta);
  }

  if (scope === "global") {
    const { items, meta } = await getGlobalRanking(pagination);
    return apiSuccessPaginated(items, meta);
  }

  // Default: city
  const city = await getRequestCity(request);
  const { items, meta } = await getCityRanking(city, pagination);
  return apiSuccessPaginated(items, meta);
}
