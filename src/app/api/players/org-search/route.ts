/**
 * GET /api/players/org-search?leagueId=uuid&q=texto
 *
 * Búsqueda por nombre para el flujo "Agregar jugador existente" a un equipo.
 * Devuelve global_players de la organización dueña de la liga (scope org).
 *
 * Autenticación obligatoria. La org se resuelve desde la liga, no desde la
 * sesión: así los owners (sin org propia) también pueden buscar en la org de
 * la liga que gestionan. Los organizers solo pueden buscar en su propia org.
 */

import { eq } from "drizzle-orm";
import { db, leagues } from "@/db";
import { apiSuccess, apiError } from "@/types";
import { getSessionUserFromRequest, canManageLeague } from "@/shared/lib/auth";
import { searchOrgGlobalPlayers } from "@/entities/player/queries";

export async function GET(request: Request) {
	const session = await getSessionUserFromRequest(request);
	if (!session) return apiError("No autenticado", 401);

	const { searchParams } = new URL(request.url);
	const q = searchParams.get("q")?.trim() ?? "";
	const leagueId = searchParams.get("leagueId") ?? "";

	if (!leagueId) return apiError("leagueId requerido", 400);
	if (q.length < 2) return apiSuccess([]);

	const [league] = await db
		.select({ organizationId: leagues.organizationId })
		.from(leagues)
		.where(eq(leagues.id, leagueId))
		.limit(1);

	if (!league) return apiError("Liga no encontrada", 404);
	if (!canManageLeague(session, league.organizationId ?? null)) {
		return apiError("Sin permiso para buscar en esta liga", 403);
	}
	// Ligas legacy sin organización: no hay universo org donde buscar.
	if (!league.organizationId) return apiSuccess([]);

	const results = await searchOrgGlobalPlayers(league.organizationId, q, leagueId);
	return apiSuccess(results);
}
