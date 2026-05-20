/**
 * POST /api/matchdays/[matchdayId]/reopen
 *
 * Reabre una jornada playoff que quedó en estado "completed" por error.
 * Solo aplica a jornadas con phase="playoff" — las jornadas regulares
 * cerradas son permanentes y no se pueden reabrir por esta ruta.
 */
import { apiSuccess, apiError } from "@/types";
import { getSessionUserFromRequest, canManageLeague } from "@/shared/lib/auth";
import { db } from "@/db";
import { matchdays } from "@/db/schema";
import { eq } from "drizzle-orm";

type Params = { params: Promise<{ matchdayId: string }> };

export async function POST(request: Request, { params }: Params) {
	const session = await getSessionUserFromRequest(request);
	if (!session) return apiError("No autenticado", 401);

	const { matchdayId } = await params;

	const matchday = await db.query.matchdays.findFirst({
		where: eq(matchdays.id, matchdayId),
		with: { league: { columns: { organizationId: true } } },
		columns: { id: true, status: true, phase: true, leagueId: true },
	});
	if (!matchday) return apiError("Jornada no encontrada", 404);
	if (!canManageLeague(session, matchday.league?.organizationId ?? null)) {
		return apiError("Sin permiso", 403);
	}
	if (matchday.phase !== "playoff") {
		return apiError("Solo se pueden reabrir jornadas de fase final", 400);
	}
	if (matchday.status !== "completed") {
		return apiError("La jornada no está cerrada", 409);
	}

	await db.update(matchdays).set({ status: "published" }).where(eq(matchdays.id, matchdayId));

	return apiSuccess({ matchdayId, leagueId: matchday.leagueId });
}
