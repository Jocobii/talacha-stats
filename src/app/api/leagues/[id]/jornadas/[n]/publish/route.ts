/**
 * POST /api/leagues/[id]/jornadas/[n]/publish
 *
 * Cambia el status de la jornada n de 'draft' a 'published'.
 * Error 400 si no tiene matches. Error 409 si ya está published/in_progress/completed.
 */

import { apiSuccess, apiError } from "@/types";
import { getSessionUserFromRequest, canManageLeague } from "@/shared/lib/auth";
import { db } from "@/db";
import { leagues, matchdays, matches } from "@/db/schema";
import { eq, and, count } from "drizzle-orm";

type Params = { params: Promise<{ id: string; n: string }> };

export async function POST(request: Request, { params }: Params) {
	const session = await getSessionUserFromRequest(request);
	if (!session) return apiError("No autenticado", 401);

	const { id, n } = await params;
	const matchdayNumber = parseInt(n, 10);
	if (isNaN(matchdayNumber) || matchdayNumber < 1)
		return apiError("Número de jornada inválido", 400);

	const league = await db.query.leagues.findFirst({
		where: eq(leagues.id, id),
		columns: { id: true, organizationId: true, schedulingEnabled: true },
	});
	if (!league) return apiError("Liga no encontrada", 404);
	if (!league.schedulingEnabled) return apiError("Módulo de sorteo no habilitado", 400);
	if (!canManageLeague(session, league.organizationId ?? null)) return apiError("Sin permiso", 403);

	const matchday = await db.query.matchdays.findFirst({
		where: and(eq(matchdays.leagueId, id), eq(matchdays.number, matchdayNumber)),
		columns: { id: true, status: true },
	});
	if (!matchday) return apiError("Jornada no encontrada", 404);

	if (matchday.status !== "draft") {
		return apiError(`No se puede publicar: la jornada está en estado "${matchday.status}"`, 409);
	}

	const [countRow] = await db
		.select({ total: count() })
		.from(matches)
		.where(eq(matches.matchdayId, matchday.id));

	if ((countRow?.total ?? 0) === 0) {
		return apiError(
			"No se puede publicar una jornada sin partidos. Realiza el sorteo primero.",
			400,
		);
	}

	const [updated] = await db
		.update(matchdays)
		.set({ status: "published" })
		.where(eq(matchdays.id, matchday.id))
		.returning({ id: matchdays.id, status: matchdays.status });

	return apiSuccess({ matchdayId: updated?.id, status: updated?.status });
}
