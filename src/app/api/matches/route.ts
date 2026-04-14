import { db, matches } from "@/db";
import { eq, desc } from "drizzle-orm";
import { CreateMatchSchema, apiSuccess, apiError } from "@/types";

// GET /api/matches?league_id=xxx&status=scheduled
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const leagueId = searchParams.get("league_id");
  const status = searchParams.get("status");

  const rows = await db.query.matches.findMany({
    where: leagueId ? eq(matches.leagueId, leagueId) : undefined,
    orderBy: [desc(matches.matchDate)],
    with: {
      homeTeam: true,
      awayTeam: true,
      league: true,
    },
    limit: 100,
  });

  const filtered = status ? rows.filter((m) => m.status === status) : rows;
  return apiSuccess(filtered);
}

// POST /api/matches
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = CreateMatchSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.message);

  if (parsed.data.homeTeamId === parsed.data.awayTeamId)
    return apiError("El equipo local y visitante no pueden ser el mismo", 400);

  const [match] = await db
    .insert(matches)
    .values({
      leagueId: parsed.data.leagueId,
      homeTeamId: parsed.data.homeTeamId,
      awayTeamId: parsed.data.awayTeamId,
      matchDate: parsed.data.matchDate,
      matchday: parsed.data.matchday ?? null,
      notes: parsed.data.notes ?? null,
    })
    .returning();

  return apiSuccess(match, 201);
}
