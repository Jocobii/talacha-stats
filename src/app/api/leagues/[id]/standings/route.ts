import { getLeagueStandings } from "@/lib/standings";
import { apiSuccess, apiError } from "@/types";
import { db, leagues } from "@/db";
import { eq } from "drizzle-orm";

// GET /api/leagues/:id/standings
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const league = await db.query.leagues.findFirst({ where: eq(leagues.id, id) });
  if (!league) return apiError("Liga no encontrada", 404);

  const standings = await getLeagueStandings(id);
  return apiSuccess({ league, standings });
}
