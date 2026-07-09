import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, teams, leagues } from "@/db";
import { getTeamRoster } from "@/entities/team";
import { apiSuccess, apiError } from "@/types";
import { getSessionUserFromRequest, canManageLeague } from "@/shared/lib/auth";
import { addExistingPlayerToTeam } from "@/features/team-management/actions";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET /api/teams/:id/members
 *
 * Roster V2 (inscriptions → league_members → global_players) en la forma
 * `RosterEntry` que consume la UI. Controlador delgado (§3.2): delega en la
 * query de entidad `getTeamRoster`. Es la fuente cliente del roster para que
 * TanStack Query pueda invalidar/refetch en vez de `router.refresh()`.
 */
export async function GET(_: Request, { params }: RouteParams) {
	const { id } = await params;
	const roster = await getTeamRoster(id);
	return apiSuccess(roster);
}

const AddMemberSchema = z.object({
	globalPlayerId: z.string().uuid("globalPlayerId debe ser un UUID"),
	dorsal: z.number().int().min(1).max(99).nullable().optional(),
});

/**
 * POST /api/teams/:id/members
 *
 * Agrega un jugador EXISTENTE al equipo (no crea identidad). Resuelve la org
 * desde la liga del equipo y valida permiso. La creación de jugadores nuevos
 * vive en /admin/registro, no aquí.
 */
export async function POST(request: Request, { params }: RouteParams) {
	const session = await getSessionUserFromRequest(request);
	if (!session) return apiError("No autenticado", 401);

	const { id: teamId } = await params;

	const [team] = await db
		.select({ leagueId: teams.leagueId, organizationId: leagues.organizationId })
		.from(teams)
		.innerJoin(leagues, eq(leagues.id, teams.leagueId))
		.where(eq(teams.id, teamId))
		.limit(1);

	if (!team) return apiError("Equipo no encontrado", 404);
	if (!canManageLeague(session, team.organizationId ?? null)) {
		return apiError("Sin permiso para gestionar este equipo", 403);
	}

	const body = await request.json().catch(() => null);
	const parsed = AddMemberSchema.safeParse(body);
	if (!parsed.success) {
		return apiError(parsed.error.issues[0]?.message ?? "Datos inválidos", 400);
	}

	const result = await addExistingPlayerToTeam({
		globalPlayerId: parsed.data.globalPlayerId,
		leagueId: team.leagueId,
		teamId,
		dorsal: parsed.data.dorsal ?? null,
	});

	if (!result.ok) return apiError(result.error, 409);

	return apiSuccess(await getTeamRoster(teamId), 201);
}
