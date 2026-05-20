/**
 * DELETE /api/leagues/[id]/venues/[venueId] — desasigna una cancha de la liga
 */

import { apiSuccess, apiError } from "@/types";
import { getSessionUserFromRequest, canManageLeague } from "@/shared/lib/auth";
import { db } from "@/db";
import { leagues } from "@/db/schema";
import { eq } from "drizzle-orm";
import { unassignVenueFromLeague } from "@/features/venue-management";

type Params = { params: Promise<{ id: string; venueId: string }> };

export async function DELETE(request: Request, { params }: Params) {
	const session = await getSessionUserFromRequest(request);
	if (!session) return apiError("No autenticado", 401);

	const { id, venueId } = await params;
	const league = await db.query.leagues.findFirst({
		where: eq(leagues.id, id),
		columns: { id: true, organizationId: true },
	});
	if (!league) return apiError("Liga no encontrada", 404);
	if (!canManageLeague(session, league.organizationId ?? null)) return apiError("Sin permiso", 403);

	const result = await unassignVenueFromLeague(id, venueId);
	if (!result.ok) return apiError(result.error, result.status);
	return apiSuccess({ unassigned: true });
}
