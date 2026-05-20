/**
 * PATCH /api/leagues/[id]/matches/[matchId]/swap
 * Sustituye un equipo en un partido por otro, respetando S4 si aplica.
 * Registra override en audit log.
 */

import { apiSuccess, apiError, SwapTeamSchema } from "@/types";
import { getSessionUserFromRequest, canManageLeague } from "@/shared/lib/auth";
import { db } from "@/db";
import { leagues } from "@/db/schema";
import { eq } from "drizzle-orm";
import { swapTeams } from "@/features/scheduling/overrides/swap-teams";

type Params = { params: Promise<{ id: string; matchId: string }> };

export async function PATCH(request: Request, { params }: Params) {
	const session = await getSessionUserFromRequest(request);
	if (!session) return apiError("No autenticado", 401);

	const { id, matchId } = await params;

	const league = await db.query.leagues.findFirst({
		where: eq(leagues.id, id),
		columns: { id: true, organizationId: true, schedulingEnabled: true },
	});
	if (!league) return apiError("Liga no encontrada", 404);
	if (!league.schedulingEnabled) return apiError("El módulo de sorteo no está habilitado", 400);
	if (!canManageLeague(session, league.organizationId ?? null)) return apiError("Sin permiso", 403);

	const body = await request.json().catch(() => ({}));
	const parsed = SwapTeamSchema.safeParse(body);
	if (!parsed.success) return apiError(parsed.error.message, 400);

	const result = await swapTeams({
		matchId,
		leagueId: id,
		changedBy: session.id,
		oldTeamId: parsed.data.oldTeamId,
		newTeamId: parsed.data.newTeamId,
		reason: parsed.data.reason,
	});

	if (!result.ok) return apiError(result.error, 422);
	return apiSuccess({ matchId: result.matchId, position: result.position });
}
