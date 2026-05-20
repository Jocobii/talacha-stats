/**
 * GET  /api/leagues/[id]/venues/[venueId]/windows — lista ventanas
 * POST /api/leagues/[id]/venues/[venueId]/windows — crea ventana
 */

import { apiSuccess, apiError, CreateVenueWindowSchema } from "@/types";
import { getSessionUserFromRequest, canManageLeague } from "@/shared/lib/auth";
import { db } from "@/db";
import { leagues, venueTimeWindows } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { createWindow } from "@/features/venue-management";

type Params = { params: Promise<{ id: string; venueId: string }> };

async function resolveLeague(id: string) {
	return db.query.leagues.findFirst({
		where: eq(leagues.id, id),
		columns: { id: true, organizationId: true },
	});
}

export async function GET(request: Request, { params }: Params) {
	const session = await getSessionUserFromRequest(request);
	if (!session) return apiError("No autenticado", 401);

	const { id, venueId } = await params;
	const league = await resolveLeague(id);
	if (!league) return apiError("Liga no encontrada", 404);
	if (!canManageLeague(session, league.organizationId ?? null)) return apiError("Sin permiso", 403);

	const windows = await db.query.venueTimeWindows.findMany({
		where: and(eq(venueTimeWindows.leagueId, id), eq(venueTimeWindows.venueId, venueId)),
		orderBy: (w, { asc }) => [asc(w.dayOfWeek), asc(w.startTime)],
	});
	return apiSuccess(windows);
}

export async function POST(request: Request, { params }: Params) {
	const session = await getSessionUserFromRequest(request);
	if (!session) return apiError("No autenticado", 401);

	const { id, venueId } = await params;
	const league = await resolveLeague(id);
	if (!league) return apiError("Liga no encontrada", 404);
	if (!canManageLeague(session, league.organizationId ?? null)) return apiError("Sin permiso", 403);

	const body = await request.json().catch(() => null);
	const parsed = CreateVenueWindowSchema.safeParse({ ...body, venueId });
	if (!parsed.success) return apiError(parsed.error.message, 400);

	const result = await createWindow(id, parsed.data);
	if (!result.ok) return apiError(result.error, result.status);
	return apiSuccess(result.window, 201);
}
