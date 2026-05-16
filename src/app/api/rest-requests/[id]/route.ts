/**
 * DELETE /api/rest-requests/[id] — cancela solicitud de descanso
 */

import { apiSuccess, apiError } from "@/types";
import { getSessionUserFromRequest, canManageLeague } from "@/shared/lib/auth";
import { db } from "@/db";
import { teamRestRequests, leagues } from "@/db/schema";
import { eq } from "drizzle-orm";
import { deleteRestRequest } from "@/features/scheduling/rest/delete-rest-request";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(request: Request, { params }: Params) {
	const session = await getSessionUserFromRequest(request);
	if (!session) return apiError("No autenticado", 401);

	const { id } = await params;
	const req = await db.query.teamRestRequests.findFirst({
		where: eq(teamRestRequests.id, id),
		columns: { id: true, leagueId: true },
	});
	if (!req) return apiError("Solicitud de descanso no encontrada", 404);

	const league = await db.query.leagues.findFirst({
		where: eq(leagues.id, req.leagueId),
		columns: { organizationId: true },
	});
	if (!canManageLeague(session, league?.organizationId ?? null))
		return apiError("Sin permiso", 403);

	const result = await deleteRestRequest(id);
	if (!result.ok) return apiError(result.error, result.status);
	return apiSuccess({ deleted: true });
}
