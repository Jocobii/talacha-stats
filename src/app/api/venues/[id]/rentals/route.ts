/**
 * POST /api/venues/[id]/rentals
 * Crea una nueva renta directa para la cancha.
 * Valida conflictos con rentas existentes (409 si hay solapamiento).
 */

import { apiSuccess, apiError, CreateRentalSchema } from "@/types";
import { getSessionUserFromRequest } from "@/shared/lib/auth";
import { db } from "@/db";
import { venues } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createRental } from "@/features/venue-calendar";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
	const session = await getSessionUserFromRequest(request);
	if (!session) return apiError("No autenticado", 401);

	const { id } = await params;

	const venue = await db.query.venues.findFirst({
		where: eq(venues.id, id),
		columns: { id: true, organizationId: true },
	});
	if (!venue) return apiError("Cancha no encontrada", 404);

	const canAccess =
		session.role === "owner" ||
		(session.role === "organizer" && session.organizationId === venue.organizationId);
	if (!canAccess) return apiError("Sin permiso", 403);

	const body = await request.json().catch(() => ({}));
	const parsed = CreateRentalSchema.safeParse(body);
	if (!parsed.success) return apiError(parsed.error.message, 400);

	const result = await createRental({ venueId: id, payload: parsed.data });
	if (!result.ok) return apiError(result.error, result.status);

	return apiSuccess(result.rental, 201);
}
