/**
 * GET  /api/venues?organization_id=xxx — lista canchas de una org
 * POST /api/venues                     — crea una cancha
 */

import { apiSuccess, apiError, CreateVenueSchema } from "@/types";
import { getSessionUserFromRequest } from "@/shared/lib/auth";
import { listVenuesWithStats } from "@/entities/venue";
import { createVenue } from "@/features/venue-management";

export async function GET(request: Request) {
	const session = await getSessionUserFromRequest(request);
	if (!session) return apiError("No autenticado", 401);

	const orgId = new URL(request.url).searchParams.get("organization_id") ?? session.organizationId;
	if (!orgId) return apiError("Falta organization_id", 400);

	if (session.role !== "owner" && session.organizationId !== orgId) {
		return apiError("Sin permiso para ver estas canchas", 403);
	}

	const data = await listVenuesWithStats(orgId);
	return apiSuccess(data);
}

export async function POST(request: Request) {
	const session = await getSessionUserFromRequest(request);
	if (!session) return apiError("No autenticado", 401);

	const body = await request.json().catch(() => null);
	const parsed = CreateVenueSchema.safeParse(body);
	if (!parsed.success) return apiError(parsed.error.message, 400);

	const { organizationId } = parsed.data;
	if (session.role !== "owner" && session.organizationId !== organizationId) {
		return apiError("Sin permiso para crear canchas en esta organización", 403);
	}

	const result = await createVenue(parsed.data);
	if (!result.ok) return apiError(result.error, result.status);
	return apiSuccess(result.venue, 201);
}
