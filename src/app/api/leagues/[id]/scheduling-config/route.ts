/**
 * GET /api/leagues/[id]/scheduling-config — lee config de sorteo
 * PUT /api/leagues/[id]/scheduling-config — crea o actualiza config
 */

import { apiSuccess, apiError, SchedulingConfigSchema } from "@/types";
import { getSessionUserFromRequest, canManageLeague } from "@/shared/lib/auth";
import { db } from "@/db";
import { leagues } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSchedulingConfig } from "@/features/scheduling/config/get-config";
import { upsertSchedulingConfig } from "@/features/scheduling/config/upsert-config";

type Params = { params: Promise<{ id: string }> };

async function resolveLeagueWithGuard(request: Request, leagueId: string) {
	const session = await getSessionUserFromRequest(request);
	if (!session) return { session: null, league: null, error: apiError("No autenticado", 401) };

	const league = await db.query.leagues.findFirst({
		where: eq(leagues.id, leagueId),
		columns: { id: true, organizationId: true, schedulingEnabled: true },
	});
	if (!league) return { session, league: null, error: apiError("Liga no encontrada", 404) };
	if (!league.schedulingEnabled)
		return {
			session,
			league: null,
			error: apiError("El módulo de sorteo no está habilitado para esta liga", 400),
		};
	if (!canManageLeague(session, league.organizationId ?? null))
		return { session, league: null, error: apiError("Sin permiso", 403) };

	return { session, league, error: null };
}

export async function GET(request: Request, { params }: Params) {
	const { id } = await params;
	const { league, error } = await resolveLeagueWithGuard(request, id);
	if (error) return error;

	const config = await getSchedulingConfig(id);
	if (!config) return apiError("La liga no tiene configuración de sorteo aún", 404);
	return apiSuccess(config);
}

export async function PUT(request: Request, { params }: Params) {
	const { id } = await params;
	const { league, error } = await resolveLeagueWithGuard(request, id);
	if (error) return error;
	void league;

	const body = await request.json().catch(() => null);
	const parsed = SchedulingConfigSchema.safeParse(body);
	if (!parsed.success) return apiError(parsed.error.message, 400);

	const result = await upsertSchedulingConfig(id, parsed.data);
	if (!result.ok) return apiError(result.error, result.status);
	return apiSuccess(result.config);
}
