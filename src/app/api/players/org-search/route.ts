/**
 * GET /api/players/org-search?leagueId=uuid&q=texto
 *
 * Búsqueda por nombre para el flujo "Agregar jugador existente" a un equipo.
 * global_players es identidad de plataforma (§14 AGENTS.md) — la búsqueda NO
 * se limita a jugadores con membresía previa en la organización, para poder
 * encontrar jugadores registrados sin liga todavía o con historial solo en
 * otra organización (ver docs/CREDENCIAL-CODIGO-JUGADOR.md). El nombre de la
 * ruta ("org-search") queda por compatibilidad con la URL ya usada por el
 * cliente; el filtro real de "puedes gestionar esta liga" sigue aplicando.
 *
 * Autenticación obligatoria. El permiso se resuelve desde la liga: los
 * owners (sin org propia) pueden buscar para cualquier liga que gestionan,
 * los organizers solo para ligas de su propia org.
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
	const results = await searchOrgGlobalPlayers(q, leagueId);
	return apiSuccess(results);
}
