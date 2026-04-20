import { db, matches, leagues } from "@/db";
import { eq, desc, count, and, inArray } from "drizzle-orm";
import { MATCH_STATUSES, type MatchStatus } from "@/db/schema";
import { CreateMatchSchema, apiSuccess, apiSuccessPaginated, apiError } from "@/types";
import { parsePaginationParams, buildMeta, toOffset } from "@/shared/lib/pagination";
import { getRequestCity } from "@/shared/lib/active-city";

// GET /api/matches?league_id=xxx&status=scheduled&page=1&limit=20&city=Tijuana
// When league_id is provided, city filter is implicit.
// When no league_id, filters by all leagues in the active city.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const leagueId  = searchParams.get("league_id") ?? undefined;
  const statusRaw = searchParams.get("status")    ?? undefined;
  const status    = statusRaw && (MATCH_STATUSES as readonly string[]).includes(statusRaw)
    ? statusRaw as MatchStatus
    : undefined;

  const params = parsePaginationParams(searchParams, { limit: 25 });

  let leagueWhere;

  if (leagueId) {
    leagueWhere = eq(matches.leagueId, leagueId);
  } else {
    const city = await getRequestCity(request);
    const cityLeagues = await db
      .select({ id: leagues.id })
      .from(leagues)
      .where(eq(leagues.city, city));

    const leagueIds = cityLeagues.map((l) => l.id);
    leagueWhere = leagueIds.length > 0 ? inArray(matches.leagueId, leagueIds) : undefined;
  }

  const where = and(leagueWhere, status ? eq(matches.status, status) : undefined);

  const [totalRow, rows] = await Promise.all([
    db.select({ count: count() }).from(matches).where(where),
    db.query.matches.findMany({
      where,
      orderBy: [desc(matches.matchDate)],
      with: { homeTeam: true, awayTeam: true, league: true },
      limit:  params.limit,
      offset: toOffset(params),
    }),
  ]);

  const meta = buildMeta(totalRow[0].count, params);
  return apiSuccessPaginated(rows, meta);
}

// POST /api/matches
export async function POST(request: Request) {
  const body   = await request.json().catch(() => null);
  const parsed = CreateMatchSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.message);

  if (parsed.data.homeTeamId === parsed.data.awayTeamId)
    return apiError("El equipo local y visitante no pueden ser el mismo", 400);

  const [match] = await db
    .insert(matches)
    .values({
      leagueId:   parsed.data.leagueId,
      homeTeamId: parsed.data.homeTeamId,
      awayTeamId: parsed.data.awayTeamId,
      matchDate:  parsed.data.matchDate,
      matchday:   parsed.data.matchday ?? null,
      notes:      parsed.data.notes    ?? null,
    })
    .returning();

  return apiSuccess(match, 201);
}
