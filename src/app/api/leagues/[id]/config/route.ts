/**
 * GET   /api/leagues/[id]/config — lee el reglamento del torneo (con defaults)
 * PATCH /api/leagues/[id]/config — edita el reglamento; rechaza si está
 *   congelado (locked_at) porque el torneo ya arrancó — §4.4 de
 *   docs/MODULOS-GESTION-LIGA.md.
 */

import { apiSuccess, apiError } from "@/types";
import { getSessionUserFromRequest, canManageLeague } from "@/shared/lib/auth";
import { db } from "@/db";
import { leagues } from "@/db/schema";
import { eq } from "drizzle-orm";
import { UpdateLeagueConfigSchema } from "@/entities/league-config";
import { getLeagueRules, updateLeagueRules } from "@/features/tournament-rules/rules";

type Params = { params: Promise<{ id: string }> };

async function resolveLeagueWithGuard(request: Request, leagueId: string) {
	const session = await getSessionUserFromRequest(request);
	if (!session) return { league: null, error: apiError("No autenticado", 401) };

	const league = await db.query.leagues.findFirst({
		where: eq(leagues.id, leagueId),
		columns: { id: true, organizationId: true },
	});
	if (!league) return { league: null, error: apiError("Liga no encontrada", 404) };
	if (!canManageLeague(session, league.organizationId ?? null))
		return { league: null, error: apiError("Sin permiso", 403) };

	return { league, error: null };
}

export async function GET(request: Request, { params }: Params) {
	const { id } = await params;
	const { error } = await resolveLeagueWithGuard(request, id);
	if (error) return error;

	return apiSuccess(await getLeagueRules(id));
}

export async function PATCH(request: Request, { params }: Params) {
	const { id } = await params;
	const { error } = await resolveLeagueWithGuard(request, id);
	if (error) return error;

	const body = await request.json().catch(() => null);
	const parsed = UpdateLeagueConfigSchema.safeParse(body);
	if (!parsed.success) return apiError(parsed.error.message, 400);

	const result = await updateLeagueRules(id, parsed.data);
	if (!result.ok) return apiError(result.error, result.status);
	return apiSuccess(result.config);
}
