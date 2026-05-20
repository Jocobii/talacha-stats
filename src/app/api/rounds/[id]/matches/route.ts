/**
 * GET /api/rounds/[id]/matches
 * Lista los partidos de una jornada para el dashboard de resolución.
 */
import { apiSuccess, apiError } from "@/types";
import { getSessionUserFromRequest, canManageLeague } from "@/shared/lib/auth";
import { db } from "@/db";
import { matchdays } from "@/db/schema";
import { eq } from "drizzle-orm";
import { listMatchesByRound } from "@/entities/match/queries";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
	const session = await getSessionUserFromRequest(request);
	if (!session) return apiError("No autenticado", 401);

	const { id } = await params;

	const matchday = await db.query.matchdays.findFirst({
		where: eq(matchdays.id, id),
		with: { league: { columns: { organizationId: true } } },
		columns: { id: true },
	});
	if (!matchday) return apiError("Jornada no encontrada", 404);
	if (!canManageLeague(session, matchday.league?.organizationId ?? null)) {
		return apiError("Sin permiso", 403);
	}

	const matchList = await listMatchesByRound(id);
	return apiSuccess(matchList);
}
