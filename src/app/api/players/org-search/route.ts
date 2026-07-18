/**
 * GET /api/players/org-search?leagueId=uuid&q=texto
 *
 * Búsqueda por nombre para el flujo "Agregar jugador existente" a un equipo.
 *
 * CORREGIDO (julio 2026): antes buscaba en TODO `global_players` sin filtro
 * de organización — un organizador podía encontrar y agregar a su equipo
 * cualquier jugador de la plataforma, incluso si nunca fue dado de alta en
 * su organización. Eso viola la regla de negocio de que solo el encargado
 * de la liga puede darlo de alta explícitamente (/admin/registro, §14
 * AGENTS.md). Ahora `searchOrgGlobalPlayers` escopa el resultado a la
 * organización de ESTA liga (o a "ya es miembro de esta liga" si la liga no
 * tiene organización). El nombre de la ruta ("org-search") queda por
 * compatibilidad con la URL ya usada por el cliente.
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
	const results = await searchOrgGlobalPlayers(q, {
		leagueId,
		organizationId: league.organizationId ?? null,
	});
	return apiSuccess(results);
}
