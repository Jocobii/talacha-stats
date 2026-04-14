import { getPlayerLeagueStats, getPlayerGlobalStats } from "@/lib/stats";
import { apiSuccess, apiError } from "@/types";
import { db, players } from "@/db";
import { eq } from "drizzle-orm";

// GET /api/players/:id/stats
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const player = await db.query.players.findFirst({ where: eq(players.id, id) });
  if (!player) return apiError("Jugador no encontrado", 404);

  const [byLeague, global] = await Promise.all([
    getPlayerLeagueStats(id),
    getPlayerGlobalStats(id),
  ]);

  return apiSuccess({ player, byLeague, global });
}
