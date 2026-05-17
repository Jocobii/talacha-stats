/**
 * PATCH /api/venue-rentals/[id]  → actualizar renta
 * DELETE /api/venue-rentals/[id] → eliminar renta
 */

import { apiSuccess, apiError, UpdateRentalSchema } from "@/types";
import { getSessionUserFromRequest } from "@/shared/lib/auth";
import { db } from "@/db";
import { venueRentals } from "@/db/schema";
import { eq } from "drizzle-orm";
import { updateRental, deleteRental } from "@/features/venue-calendar";

type Params = { params: Promise<{ id: string }> };

async function resolveRentalAndCheckAccess(
	id: string,
	session: { role: string; organizationId: string | null | undefined },
) {
	const rental = await db.query.venueRentals.findFirst({
		where: eq(venueRentals.id, id),
		with: { venue: { columns: { organizationId: true } } },
	});
	if (!rental) return { rental: null, allowed: false };

	const allowed =
		session.role === "owner" ||
		(session.role === "organizer" && session.organizationId === rental.venue.organizationId);

	return { rental, allowed };
}

export async function PATCH(request: Request, { params }: Params) {
	const session = await getSessionUserFromRequest(request);
	if (!session) return apiError("No autenticado", 401);

	const { id } = await params;
	const { rental, allowed } = await resolveRentalAndCheckAccess(id, session);
	if (!rental) return apiError("Renta no encontrada", 404);
	if (!allowed) return apiError("Sin permiso", 403);

	const body = await request.json().catch(() => ({}));
	const parsed = UpdateRentalSchema.safeParse(body);
	if (!parsed.success) return apiError(parsed.error.message, 400);

	const result = await updateRental(id, parsed.data);
	if (!result.ok) return apiError(result.error, result.status);

	return apiSuccess(result.rental);
}

export async function DELETE(_request: Request, { params }: Params) {
	const session = await getSessionUserFromRequest(_request);
	if (!session) return apiError("No autenticado", 401);

	const { id } = await params;
	const { rental, allowed } = await resolveRentalAndCheckAccess(id, session);
	if (!rental) return apiError("Renta no encontrada", 404);
	if (!allowed) return apiError("Sin permiso", 403);

	const result = await deleteRental(id);
	if (!result.ok) return apiError(result.error, result.status);

	return apiSuccess({ id: result.id });
}
