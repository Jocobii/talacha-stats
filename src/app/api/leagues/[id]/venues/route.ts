/**
 * GET  /api/leagues/[id]/venues — canchas asignadas a la liga con sus ventanas
 * POST /api/leagues/[id]/venues — asigna una cancha a la liga
 */

import { z } from "zod";
import { apiSuccess, apiError } from "@/types";
import { getSessionUserFromRequest, canManageLeague } from "@/shared/lib/auth";
import { db } from "@/db";
import { leagues } from "@/db/schema";
import { eq } from "drizzle-orm";
import { listVenuesByLeague } from "@/entities/venue";
import { assignVenueToLeague } from "@/features/venue-management";

const AssignSchema = z.object({
	venueId: z.string().uuid(),
	priority: z.number().int().min(1).max(99).optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
	const session = await getSessionUserFromRequest(request);
	if (!session) return apiError("No autenticado", 401);

	const { id } = await params;
	const league = await db.query.leagues.findFirst({
		where: eq(leagues.id, id),
		columns: { id: true, organizationId: true },
	});
	if (!league) return apiError("Liga no encontrada", 404);
	if (!canManageLeague(session, league.organizationId ?? null)) return apiError("Sin permiso", 403);

	return apiSuccess(await listVenuesByLeague(id));
}

export async function POST(request: Request, { params }: Params) {
	const session = await getSessionUserFromRequest(request);
	if (!session) return apiError("No autenticado", 401);

	const { id } = await params;
	const league = await db.query.leagues.findFirst({
		where: eq(leagues.id, id),
		columns: { id: true, organizationId: true },
	});
	if (!league) return apiError("Liga no encontrada", 404);
	if (!canManageLeague(session, league.organizationId ?? null)) return apiError("Sin permiso", 403);

	const body = await request.json().catch(() => null);
	const parsed = AssignSchema.safeParse(body);
	if (!parsed.success) return apiError(parsed.error.message, 400);

	const result = await assignVenueToLeague(id, parsed.data.venueId, parsed.data.priority);
	if (!result.ok) return apiError(result.error, result.status);
	return apiSuccess(result.leagueVenue, 201);
}
