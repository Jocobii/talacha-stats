import { db, leagues } from "@/db";
import { desc } from "drizzle-orm";
import { CreateLeagueSchema, apiSuccess, apiError } from "@/types";

// GET /api/leagues
export async function GET() {
  const rows = await db.query.leagues.findMany({
    orderBy: [desc(leagues.createdAt)],
    with: {
      teams: true,
    },
  });

  return apiSuccess(rows);
}

// POST /api/leagues
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = CreateLeagueSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.message);

  const [league] = await db
    .insert(leagues)
    .values({
      name: parsed.data.name,
      dayOfWeek: parsed.data.dayOfWeek,
      season: parsed.data.season,
    })
    .returning();

  return apiSuccess(league, 201);
}
