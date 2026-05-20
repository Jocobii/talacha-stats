/**
 * PATCH  /api/purchased-timeslots/[id] — edita horario comprado
 * DELETE /api/purchased-timeslots/[id] — elimina horario comprado
 */

import { apiSuccess, apiError, UpdatePurchasedTimeslotSchema } from "@/types";
import { getSessionUserFromRequest, canManageLeague } from "@/shared/lib/auth";
import { db } from "@/db";
import { teamPurchasedTimeslots, leagues } from "@/db/schema";
import { eq } from "drizzle-orm";
import { updatePurchasedSlot } from "@/features/scheduling/purchased/update-purchased-slot";
import { deletePurchasedSlot } from "@/features/scheduling/purchased/delete-purchased-slot";

type Params = { params: Promise<{ id: string }> };

async function resolveSlot(request: Request, id: string) {
	const session = await getSessionUserFromRequest(request);
	if (!session) return { session: null, error: apiError("No autenticado", 401) };

	const slot = await db.query.teamPurchasedTimeslots.findFirst({
		where: eq(teamPurchasedTimeslots.id, id),
		columns: { id: true, leagueId: true },
	});
	if (!slot) return { session: null, error: apiError("Horario comprado no encontrado", 404) };

	const league = await db.query.leagues.findFirst({
		where: eq(leagues.id, slot.leagueId),
		columns: { organizationId: true },
	});
	if (!canManageLeague(session, league?.organizationId ?? null)) {
		return { session: null, error: apiError("Sin permiso", 403) };
	}
	return { session, error: null };
}

export async function PATCH(request: Request, { params }: Params) {
	const { id } = await params;
	const { error } = await resolveSlot(request, id);
	if (error) return error;

	const body = await request.json().catch(() => null);
	const parsed = UpdatePurchasedTimeslotSchema.safeParse(body);
	if (!parsed.success) return apiError(parsed.error.message, 400);

	const result = await updatePurchasedSlot(id, parsed.data);
	if (!result.ok) return apiError(result.error, result.status);
	return apiSuccess(result.slot);
}

export async function DELETE(request: Request, { params }: Params) {
	const { id } = await params;
	const { error } = await resolveSlot(request, id);
	if (error) return error;

	const result = await deletePurchasedSlot(id);
	if (!result.ok) return apiError(result.error, result.status);
	return apiSuccess({ deleted: true });
}
