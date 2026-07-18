import { db, matches } from "@/db";
import { teams } from "@/db/schema";
import { eq, desc, count, and, inArray } from "drizzle-orm";
import { z } from "zod";
import { MATCH_STATUSES } from "@/db/schema";
import { CreateMatchSchema, apiSuccess, apiSuccessPaginated, apiError } from "@/types";
import { parsePaginationParams, buildMeta, toOffset } from "@/shared/lib/pagination";
import { getRequestCity } from "@/shared/lib/active-city";
import { parseQueryParams } from "@/shared/lib/query-filters";
import { getCityLeagueIds } from "@/shared/lib/db-scopes";

const MatchFiltersSchema = z.object({
	league_id: z.string().uuid().optional(),
	status: z.enum(MATCH_STATUSES).optional(),
});

// GET /api/matches?league_id=xxx&status=scheduled&page=1&limit=20&city=Tijuana
// When league_id is provided, city filter is implicit.
// When no league_id, filters by all leagues in the active city.
export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);

	const parsed = parseQueryParams(searchParams, MatchFiltersSchema);
	if (!parsed.success) return apiError("Parametros invalidos", 400);
	const { league_id: leagueId, status } = parsed.data;

	const params = parsePaginationParams(searchParams, { limit: 25 });

	let leagueWhere;

	if (leagueId) {
		leagueWhere = eq(matches.leagueId, leagueId);
	} else {
		const city = await getRequestCity(request);
		const leagueIds = await getCityLeagueIds(city);
		leagueWhere = leagueIds.length > 0 ? inArray(matches.leagueId, leagueIds) : undefined;
	}

	const where = and(leagueWhere, status ? eq(matches.status, status) : undefined);

	const [totalRow, rows] = await Promise.all([
		db.select({ count: count() }).from(matches).where(where),
		db.query.matches.findMany({
			where,
			orderBy: [desc(matches.matchDate)],
			with: { homeTeam: true, awayTeam: true, league: true },
			limit: params.limit,
			offset: toOffset(params),
		}),
	]);

	const meta = buildMeta(totalRow[0].count, params);
	return apiSuccessPaginated(rows, meta);
}

// POST /api/matches
export async function POST(request: Request) {
	const body = await request.json().catch(() => null);
	const parsed = CreateMatchSchema.safeParse(body);
	if (!parsed.success) return apiError(parsed.error.message);

	if (parsed.data.homeTeamId === parsed.data.awayTeamId)
		return apiError("El equipo local y visitante no pueden ser el mismo", 400);

	// Ambos equipos deben existir en la liga y estar 'active' — un equipo en
	// la banca ('pending') o disuelto no puede jugar un partido nuevo
	// (NUEVA-TEMPORADA-V2.md §3.2).
	const matchTeams = await db.query.teams.findMany({
		where: and(
			inArray(teams.id, [parsed.data.homeTeamId, parsed.data.awayTeamId]),
			eq(teams.leagueId, parsed.data.leagueId),
			eq(teams.status, "active"),
		),
		columns: { id: true },
	});
	if (matchTeams.length !== 2)
		return apiError("Ambos equipos deben pertenecer a la liga y estar activos", 400);

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
