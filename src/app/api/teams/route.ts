import { db, teams } from "@/db";
import { eq } from "drizzle-orm";
import { CreateTeamSchema, apiSuccess, apiError } from "@/types";

// GET /api/teams?league_id=xxx
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const leagueId = searchParams.get("league_id");

  const rows = await db.query.teams.findMany({
    where: leagueId ? eq(teams.leagueId, leagueId) : undefined,
    with: { league: true },
    orderBy: (t, { asc }) => [asc(t.name)],
  });

  return apiSuccess(rows);
}

// POST /api/teams
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = CreateTeamSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.message);

  const [team] = await db
    .insert(teams)
    .values({
      name: parsed.data.name,
      leagueId: parsed.data.leagueId,
      color: parsed.data.color ?? null,
    })
    .returning();

  return apiSuccess(team, 201);
}
