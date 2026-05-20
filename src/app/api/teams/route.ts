import { db, teams, leagues } from "@/db";
import { eq, inArray, and } from "drizzle-orm";
import { CreateTeamSchema, apiSuccess, apiError } from "@/types";
import { getRequestCity } from "@/shared/lib/active-city";
import { sanitizeToCanonical } from "@/shared/lib/normalize";

// GET /api/teams?league_id=xxx&city=Tijuana
// When league_id is provided, city filter is implicit (league already belongs to a city).
// When no league_id, returns all teams in the active city.
export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const leagueId = searchParams.get("league_id");

	if (leagueId) {
		const rows = await db.query.teams.findMany({
			where: eq(teams.leagueId, leagueId),
			with: { league: true },
			orderBy: (t, { asc }) => [asc(t.name)],
		});
		return apiSuccess(rows);
	}

	// No league_id: return all teams in the active city
	const city = await getRequestCity(request);

	const cityLeagues = await db
		.select({ id: leagues.id })
		.from(leagues)
		.where(eq(leagues.city, city));

	const leagueIds = cityLeagues.map((l) => l.id);

	if (leagueIds.length === 0) return apiSuccess([]);

	const rows = await db.query.teams.findMany({
		where: inArray(teams.leagueId, leagueIds),
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

	const nameCanonical = sanitizeToCanonical(parsed.data.name);

	// Verificación previa de duplicado por nombre canónico en la misma liga.
	// No se confía solo en el constraint de DB — se valida proactivamente para
	// devolver un mensaje claro antes de intentar el insert.
	const existing = await db.query.teams.findFirst({
		where: and(eq(teams.leagueId, parsed.data.leagueId), eq(teams.nameCanonical, nameCanonical)),
		columns: { id: true, name: true },
	});

	if (existing) {
		return apiError(
			`Ya existe un equipo con ese nombre en esta liga ("${existing.name}"). Elige un nombre diferente.`,
			409,
		);
	}

	const [team] = await db
		.insert(teams)
		.values({
			name: parsed.data.name,
			nameCanonical,
			leagueId: parsed.data.leagueId,
			color: parsed.data.color ?? null,
		})
		.returning();

	return apiSuccess(team, 201);
}
