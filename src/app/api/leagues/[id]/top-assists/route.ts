import { getLeagueTopAssists } from "@/lib/stats";
import { apiSuccess, apiError } from "@/types";
import { db, leagues } from "@/db";
import { eq } from "drizzle-orm";

// GET /api/leagues/:id/top-assists?limit=10
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "10"), 50);

  const league = await db.query.leagues.findFirst({ where: eq(leagues.id, id) });
  if (!league) return apiError("Liga no encontrada", 404);

  const topAssists = await getLeagueTopAssists(id, limit);
  return apiSuccess(topAssists);
}
