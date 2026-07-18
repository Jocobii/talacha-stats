import { db, players, leagues, playerRegistrations, organizations } from "@/db";
import { ilike, or, desc, count, and, inArray, isNull } from "drizzle-orm";
import { eq } from "drizzle-orm";
import { CreatePlayerSchema, apiSuccess, apiSuccessPaginated, apiError } from "@/types";
import type { PlayerListItem } from "@/entities/player";
import { parsePaginationParams, buildMeta, toOffset } from "@/shared/lib/pagination";
import { getRequestCity } from "@/shared/lib/active-city";
import { getSessionUserFromRequest } from "@/shared/lib/auth";

// GET /api/players?q=nombre&page=1&limit=20&city=Tijuana
// Returns players who have at least one registration in a league of the active city.
// Organizers only see players from their own leagues.
export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const q = searchParams.get("q")?.trim() || undefined;
	const params = parsePaginationParams(searchParams, { limit: 50 });

	const city = await getRequestCity(request);
	const user = await getSessionUserFromRequest(request);

	// Build the leagues filter:
	// - owners see all city leagues
	// - organizers only their org's leagues
	// - public: only verified orgs (or legacy leagues with no org)
	const isOrganizer = user && user.role !== "owner" && user.organizationId;
	const leagueWhere = isOrganizer
		? and(eq(leagues.city, city), eq(leagues.organizationId, user.organizationId!))
		: and(
				eq(leagues.city, city),
				or(isNull(leagues.organizationId), eq(organizations.status, "verified")),
			);

	// Get league IDs for the city (scoped to user if organizer)
	const cityLeagues = await db
		.select({ id: leagues.id })
		.from(leagues)
		.leftJoin(organizations, eq(leagues.organizationId, organizations.id))
		.where(leagueWhere);

	const leagueIds = cityLeagues.map((l) => l.id);

	if (leagueIds.length === 0) {
		return apiSuccessPaginated([], buildMeta(0, params));
	}

	// Get distinct player IDs registered in those leagues
	const registered = await db
		.selectDistinct({ playerId: playerRegistrations.legacyPlayerId })
		.from(playerRegistrations)
		.where(inArray(playerRegistrations.leagueId, leagueIds));

	const playerIds = registered.map((r) => r.playerId).filter((id): id is string => id !== null);

	if (playerIds.length === 0) {
		return apiSuccessPaginated([], buildMeta(0, params));
	}

	const searchWhere = q
		? or(ilike(players.fullName, `%${q}%`), ilike(players.alias, `%${q}%`))
		: undefined;

	const where = and(inArray(players.id, playerIds), searchWhere);

	const [totalRow, rows] = await Promise.all([
		db.select({ count: count() }).from(players).where(where),
		db.query.players.findMany({
			where,
			columns: { id: true, fullName: true, alias: true },
			orderBy: [desc(players.createdAt)],
			limit: params.limit,
			offset: toOffset(params),
		}),
	]);

	const meta = buildMeta(totalRow[0].count, params);
	return apiSuccessPaginated<PlayerListItem>(rows, meta);
}

// POST /api/players
export async function POST(request: Request) {
	const body = await request.json().catch(() => null);
	const parsed = CreatePlayerSchema.safeParse(body);
	if (!parsed.success) return apiError(parsed.error.message);

	const [player] = await db
		.insert(players)
		.values({
			fullName: parsed.data.fullName,
			alias: parsed.data.alias ?? null,
			phone: parsed.data.phone ?? null,
			photoUrl: parsed.data.photoUrl ?? null,
		})
		.returning();

	return apiSuccess(player, 201);
}
