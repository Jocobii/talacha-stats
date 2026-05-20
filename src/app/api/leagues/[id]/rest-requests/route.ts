/**
 * GET  /api/leagues/[id]/rest-requests — lista descansos
 * POST /api/leagues/[id]/rest-requests — crea descanso
 */

import { apiSuccess, apiError, RestRequestSchema } from "@/types";
import { getSessionUserFromRequest, canManageLeague } from "@/shared/lib/auth";
import { db } from "@/db";
import { leagues } from "@/db/schema";
import { eq } from "drizzle-orm";
import { listRestRequests } from "@/features/scheduling/rest/list-rest-requests";
import { createRestRequest } from "@/features/scheduling/rest/create-rest-request";

type Params = { params: Promise<{ id: string }> };

async function resolveLeague(request: Request, leagueId: string) {
	const session = await getSessionUserFromRequest(request);
	if (!session) return { session: null, error: apiError("No autenticado", 401) };
	const league = await db.query.leagues.findFirst({
		where: eq(leagues.id, leagueId),
		columns: { id: true, organizationId: true, schedulingEnabled: true },
	});
	if (!league) return { session, error: apiError("Liga no encontrada", 404) };
	if (!league.schedulingEnabled)
		return { session, error: apiError("Módulo de sorteo no habilitado", 400) };
	if (!canManageLeague(session, league.organizationId ?? null))
		return { session, error: apiError("Sin permiso", 403) };
	return { session, error: null };
}

export async function GET(request: Request, { params }: Params) {
	const { id } = await params;
	const { error } = await resolveLeague(request, id);
	if (error) return error;
	return apiSuccess(await listRestRequests(id));
}

export async function POST(request: Request, { params }: Params) {
	const { id } = await params;
	const { error } = await resolveLeague(request, id);
	if (error) return error;

	const body = await request.json().catch(() => null);
	const parsed = RestRequestSchema.safeParse(body);
	if (!parsed.success) return apiError(parsed.error.message, 400);

	const result = await createRestRequest(id, parsed.data);
	if (!result.ok) return apiError(result.error, result.status);
	return apiSuccess(result.restRequest, 201);
}
