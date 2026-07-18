import { db, teams } from "@/db";
import { eq, inArray, and } from "drizzle-orm";
import { z } from "zod";
import { CreateTeamSchema, apiSuccess, apiError } from "@/types";
import { getRequestCity } from "@/shared/lib/active-city";
import { sanitizeToCanonical } from "@/shared/lib/normalize";
import { parseQueryParams } from "@/shared/lib/query-filters";
import { getCityLeagueIds } from "@/shared/lib/db-scopes";

const TeamFiltersSchema = z.object({
	league_id: z.string().uuid().optional(),
});

// GET /api/teams?league_id=xxx&city=Tijuana
// When league_id is provided, city filter is implicit (league already belongs to a city).
// When no league_id, returns all teams in the active city.
export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);

	const parsed = parseQueryParams(searchParams, TeamFiltersSchema);
	if (!parsed.success) return apiError("Parametros invalidos", 400);
	const { league_id: leagueId } = parsed.data;

	// Este endpoint alimenta selectores operativos (transferencia de jugador,
	// registro por CURP, análisis del narrador) — 'pending' (banca) y
	// 'disbanded' quedan fuera (NUEVA-TEMPORADA-V2.md §3.2). La banca de
	// Configuración usa su propia query sin este filtro.
	if (leagueId) {
		const rows = await db.query.teams.findMany({
			where: and(eq(teams.leagueId, leagueId), eq(teams.status, "active")),
			with: { league: true },
			orderBy: (t, { asc }) => [asc(t.name)],
		});
		return apiSuccess(rows);
	}

	// No league_id: return all teams in the active city
	const city = await getRequestCity(request);
	const leagueIds = await getCityLeagueIds(city);

	if (leagueIds.length === 0) return apiSuccess([]);

	const rows = await db.query.teams.findMany({
		where: and(inArray(teams.leagueId, leagueIds), eq(teams.status, "active")),
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

	// Verificacion previa de duplicado por nombre canonico en la misma liga.
	// No se confia solo en el constraint de DB - se valida proactivamente para
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
