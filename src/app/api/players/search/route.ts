import { db, players } from "@/db";
import { ilike, or } from "drizzle-orm";
import { searchPlayersForDisambiguation } from "@/entities/player/ranking";
import { apiSuccess, apiError } from "@/types";

// GET /api/players/search?q=texto
//   Standard: fuzzy search for Excel import deduplication (returns simple player list)
// GET /api/players/search?q=texto&mode=disambiguation
//   Extended: global search with full participation context for "find me" ranking flow
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q    = searchParams.get("q")?.trim() ?? "";
  const mode = searchParams.get("mode");

  if (q.length < 2) return apiError("Mínimo 2 caracteres", 400);

  if (mode === "disambiguation") {
    const results = await searchPlayersForDisambiguation(q);
    return apiSuccess(results);
  }

  // Default: simple lookup for Excel import
  const term = `%${q.toLowerCase()}%`;
  const rows = await db.query.players.findMany({
    where: or(
      ilike(players.fullName, term),
      ilike(players.alias, term),
    ),
    limit: 10,
  });

  return apiSuccess(rows);
}
