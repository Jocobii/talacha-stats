import { db, players, leagues, playerRegistrations } from "@/db";
import { ilike, or, desc, count, and, inArray } from "drizzle-orm";
import { eq } from "drizzle-orm";
import { CreatePlayerSchema, apiSuccess, apiSuccessPaginated, apiError } from "@/types";
import { parsePaginationParams, buildMeta, toOffset } from "@/shared/lib/pagination";
import { getRequestCity } from "@/shared/lib/active-city";

// GET /api/players?q=nombre&page=1&limit=20&city=Tijuana
// Returns players who have at least one registration in a league of the active city.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q      = searchParams.get("q")?.trim() || undefined;
  const params = parsePaginationParams(searchParams, { limit: 50 });

  const city = await getRequestCity(request);

  // Get league IDs for the city
  const cityLeagues = await db
    .select({ id: leagues.id })
    .from(leagues)
    .where(eq(leagues.city, city));

  const leagueIds = cityLeagues.map((l) => l.id);

  if (leagueIds.length === 0) {
    return apiSuccessPaginated([], buildMeta(0, params));
  }

  // Get distinct player IDs registered in those leagues
  const registered = await db
    .selectDistinct({ playerId: playerRegistrations.playerId })
    .from(playerRegistrations)
    .where(inArray(playerRegistrations.leagueId, leagueIds));

  const playerIds = registered.map((r) => r.playerId);

  if (playerIds.length === 0) {
    return apiSuccessPaginated([], buildMeta(0, params));
  }

  const searchWhere = q
    ? or(ilike(players.fullName, `%${q}%`), ilike(players.alias, `%${q}%`))
    : undefined;

  const where = and(
    inArray(players.id, playerIds),
    searchWhere,
  );

  const [totalRow, rows] = await Promise.all([
    db.select({ count: count() }).from(players).where(where),
    db.query.players.findMany({
      where,
      orderBy: [desc(players.createdAt)],
      limit:  params.limit,
      offset: toOffset(params),
    }),
  ]);

  const meta = buildMeta(totalRow[0].count, params);
  return apiSuccessPaginated(rows, meta);
}

// POST /api/players
export async function POST(request: Request) {
  const body   = await request.json().catch(() => null);
  const parsed = CreatePlayerSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.message);

  const [player] = await db
    .insert(players)
    .values({
      fullName: parsed.data.fullName,
      alias:    parsed.data.alias    ?? null,
      phone:    parsed.data.phone    ?? null,
      photoUrl: parsed.data.photoUrl ?? null,
    })
    .returning();

  return apiSuccess(player, 201);
}
