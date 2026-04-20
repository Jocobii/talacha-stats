import { db, leagues } from "@/db";
import { eq, desc } from "drizzle-orm";
import { CreateLeagueSchema, apiSuccess, apiError } from "@/types";
import { getActiveCity, getRequestCity } from "@/shared/lib/active-city";

// GET /api/leagues?city=Tijuana
export async function GET(request: Request) {
  const city = await getRequestCity(request);

  const rows = await db.query.leagues.findMany({
    where: eq(leagues.city, city),
    orderBy: [desc(leagues.createdAt)],
    with: { teams: true },
  });

  return apiSuccess(rows);
}

// POST /api/leagues
export async function POST(request: Request) {
  const body   = await request.json().catch(() => null);
  const parsed = CreateLeagueSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.message);

  const city = await getActiveCity();

  const [league] = await db
    .insert(leagues)
    .values({
      name:      parsed.data.name,
      dayOfWeek: parsed.data.dayOfWeek,
      season:    parsed.data.season,
      city,
    })
    .returning();

  return apiSuccess(league, 201);
}
