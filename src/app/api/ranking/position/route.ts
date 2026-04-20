import { getPlayerPositions } from "@/entities/player/ranking";
import { apiSuccess, apiError } from "@/types";

// GET /api/ranking/position?playerId=xxx&city=Tijuana&leagueId=xxx
// Returns the player's rank in each applicable scope.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const playerId = searchParams.get("playerId");
  const city     = searchParams.get("city") ?? undefined;
  const leagueId = searchParams.get("leagueId") ?? undefined;

  if (!playerId) return apiError("Falta playerId", 400);

  const positions = await getPlayerPositions(playerId, { city, leagueId });
  return apiSuccess(positions);
}
