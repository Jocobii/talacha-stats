/**
 * POST /api/leagues/[id]/teams/[teamId]/disband
 *
 * Disuelve un equipo de una liga:
 *  - Marca el equipo como 'disbanded' (conserva datos históricos)
 *  - Elimina inscripciones V2 (jugadores pasan a ser agentes libres)
 *  - NO elimina playerRegistrations V1 (stats históricas se conservan)
 */
import { apiSuccess, apiError } from "@/types";
import { getSessionUserFromRequest, canManageLeague } from "@/shared/lib/auth";
import { db } from "@/db";
import { leagues, teams, inscriptions } from "@/db/schema";
import { eq, and } from "drizzle-orm";

type Params = { params: Promise<{ id: string; teamId: string }> };

export async function POST(request: Request, { params }: Params) {
	const session = await getSessionUserFromRequest(request);
	if (!session) return apiError("No autenticado", 401);

	const { id: leagueId, teamId } = await params;

	const league = await db.query.leagues.findFirst({
		where: eq(leagues.id, leagueId),
		columns: { id: true, organizationId: true },
	});
	if (!league) return apiError("Liga no encontrada", 404);
	if (!canManageLeague(session, league.organizationId)) {
		return apiError("Sin permiso", 403);
	}

	const team = await db.query.teams.findFirst({
		where: and(eq(teams.id, teamId), eq(teams.leagueId, leagueId)),
		columns: { id: true, name: true, status: true },
	});
	if (!team) return apiError("Equipo no encontrado", 404);
	if (team.status === "disbanded") return apiError("El equipo ya fue disuelto", 409);

	// Contar inscripciones V2 antes de eliminar (para feedback)
	const activeInscriptions = await db.query.inscriptions.findMany({
		where: eq(inscriptions.teamId, teamId),
		columns: { id: true },
	});
	const freedPlayers = activeInscriptions.length;

	await db.transaction(async (tx) => {
		// 1. Marcar equipo como disuelto
		await tx.update(teams).set({ status: "disbanded" }).where(eq(teams.id, teamId));

		// 2. Eliminar inscripciones V2 → jugadores quedan como agentes libres
		if (freedPlayers > 0) {
			await tx.delete(inscriptions).where(eq(inscriptions.teamId, teamId));
		}
	});

	return apiSuccess({ disbanded: true, teamName: team.name, freedPlayers });
}
