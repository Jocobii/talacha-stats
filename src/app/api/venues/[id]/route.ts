/**
 * GET    /api/venues/[id] — detalle de cancha
 * PATCH  /api/venues/[id] — editar cancha
 * DELETE /api/venues/[id] — eliminar cancha
 */

import { apiSuccess, apiError, UpdateVenueSchema } from "@/types";
import { getSessionUserFromRequest } from "@/shared/lib/auth";
import { getVenue } from "@/entities/venue";
import { updateVenue, deleteVenue } from "@/features/venue-management";

type Params = { params: Promise<{ id: string }> };

async function authorize(request: Request, venueOrgId: string) {
	const session = await getSessionUserFromRequest(request);
	if (!session) return { session: null, error: apiError("No autenticado", 401) };
	if (session.role !== "owner" && session.organizationId !== venueOrgId) {
		return { session: null, error: apiError("Sin permiso para gestionar esta cancha", 403) };
	}
	return { session, error: null };
}

export async function GET(request: Request, { params }: Params) {
	const session = await getSessionUserFromRequest(request);
	if (!session) return apiError("No autenticado", 401);

	const { id } = await params;
	const venue = await getVenue(id);
	if (!venue) return apiError("Cancha no encontrada", 404);

	if (session.role !== "owner" && session.organizationId !== venue.organizationId) {
		return apiError("Sin permiso para ver esta cancha", 403);
	}
	return apiSuccess(venue);
}

export async function PATCH(request: Request, { params }: Params) {
	const { id } = await params;
	const venue = await getVenue(id);
	if (!venue) return apiError("Cancha no encontrada", 404);

	const { error } = await authorize(request, venue.organizationId);
	if (error) return error;

	const body = await request.json().catch(() => null);
	const parsed = UpdateVenueSchema.safeParse(body);
	if (!parsed.success) return apiError(parsed.error.message, 400);

	const result = await updateVenue(id, parsed.data);
	if (!result.ok) return apiError(result.error, result.status);
	return apiSuccess(result.venue);
}

export async function DELETE(request: Request, { params }: Params) {
	const { id } = await params;
	const venue = await getVenue(id);
	if (!venue) return apiError("Cancha no encontrada", 404);

	const { error } = await authorize(request, venue.organizationId);
	if (error) return error;

	const result = await deleteVenue(id);
	if (!result.ok) {
		return apiError(result.error, result.status, {
			affectedLeagues: result.affectedLeagues ?? [],
		});
	}
	return apiSuccess({ deleted: true });
}
