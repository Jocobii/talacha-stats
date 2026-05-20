/**
 * GET  /api/leagues/[id]/makeup  — Devuelve el déficit actual sin crear nada.
 * POST /api/leagues/[id]/makeup  — Genera jornada(s) de recuperación y persiste.
 */

import { apiSuccess, apiError, MakeupBuildSchema } from "@/types";
import { getSessionUserFromRequest, canManageLeague } from "@/shared/lib/auth";
import { db } from "@/db";
import { leagues } from "@/db/schema";
import { eq } from "drizzle-orm";
import { detectDeficit } from "@/features/scheduling/makeup/detect-deficit";
import { buildMakeupMatches } from "@/features/scheduling/makeup/build-makeup-matches";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
	const session = await getSessionUserFromRequest(request);
	if (!session) return apiError("No autenticado", 401);

	const { id } = await params;

	const league = await db.query.leagues.findFirst({
		where: eq(leagues.id, id),
		columns: { id: true, organizationId: true, schedulingEnabled: true },
	});
	if (!league) return apiError("Liga no encontrada", 404);
	if (!league.schedulingEnabled) return apiError("El módulo de sorteo no está habilitado", 400);
	if (!canManageLeague(session, league.organizationId ?? null)) return apiError("Sin permiso", 403);

	const result = await detectDeficit(id);
	if (!result.ok) return apiError(result.error, 422);

	return apiSuccess({
		target: result.target,
		deficits: result.deficits,
		hasDeficits: result.deficits.length > 0,
	});
}

export async function POST(request: Request, { params }: Params) {
	const session = await getSessionUserFromRequest(request);
	if (!session) return apiError("No autenticado", 401);

	const { id } = await params;

	const league = await db.query.leagues.findFirst({
		where: eq(leagues.id, id),
		columns: { id: true, organizationId: true, schedulingEnabled: true },
	});
	if (!league) return apiError("Liga no encontrada", 404);
	if (!league.schedulingEnabled) return apiError("El módulo de sorteo no está habilitado", 400);
	if (!canManageLeague(session, league.organizationId ?? null)) return apiError("Sin permiso", 403);

	const body = await request.json().catch(() => ({}));
	const parsed = MakeupBuildSchema.safeParse(body);
	if (!parsed.success) return apiError(parsed.error.message, 400);

	const result = await buildMakeupMatches({
		leagueId: id,
		teamIds: parsed.data.teamIds,
	});

	if (!result.ok) return apiError(result.error, 422);

	return apiSuccess(
		{
			matchdayId: result.matchdayId,
			matchCount: result.matches.length,
			skipped: result.skipped,
			matches: result.matches,
		},
		201,
	);
}
