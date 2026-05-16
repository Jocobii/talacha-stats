/**
 * PATCH  /api/venue-windows/[id] — edita ventana
 * DELETE /api/venue-windows/[id] — elimina ventana
 */

import { apiSuccess, apiError, UpdateVenueWindowSchema } from "@/types";
import { getSessionUserFromRequest, canManageLeague } from "@/shared/lib/auth";
import { db } from "@/db";
import { venueTimeWindows, leagues } from "@/db/schema";
import { eq } from "drizzle-orm";
import { updateWindow, deleteWindow } from "@/features/venue-management";

type Params = { params: Promise<{ id: string }> };

async function getWindowWithLeague(id: string) {
	const window = await db.query.venueTimeWindows.findFirst({ where: eq(venueTimeWindows.id, id) });
	if (!window) return null;
	const league = await db.query.leagues.findFirst({
		where: eq(leagues.id, window.leagueId),
		columns: { id: true, organizationId: true },
	});
	return { window, league };
}

export async function PATCH(request: Request, { params }: Params) {
	const session = await getSessionUserFromRequest(request);
	if (!session) return apiError("No autenticado", 401);

	const { id } = await params;
	const found = await getWindowWithLeague(id);
	if (!found) return apiError("Ventana horaria no encontrada", 404);
	if (!canManageLeague(session, found.league?.organizationId ?? null))
		return apiError("Sin permiso", 403);

	const body = await request.json().catch(() => null);
	const parsed = UpdateVenueWindowSchema.safeParse(body);
	if (!parsed.success) return apiError(parsed.error.message, 400);

	const result = await updateWindow(id, parsed.data);
	if (!result.ok) return apiError(result.error, result.status);
	return apiSuccess(result.window);
}

export async function DELETE(request: Request, { params }: Params) {
	const session = await getSessionUserFromRequest(request);
	if (!session) return apiError("No autenticado", 401);

	const { id } = await params;
	const found = await getWindowWithLeague(id);
	if (!found) return apiError("Ventana horaria no encontrada", 404);
	if (!canManageLeague(session, found.league?.organizationId ?? null))
		return apiError("Sin permiso", 403);

	const result = await deleteWindow(id);
	if (!result.ok) return apiError(result.error, result.status);
	return apiSuccess({ deleted: true });
}
