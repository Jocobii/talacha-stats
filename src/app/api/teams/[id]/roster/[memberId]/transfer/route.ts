/**
 * app/api/teams/[id]/roster/[memberId]/transfer/route.ts
 * POST — transferir jugador a otro equipo de la misma liga.
 * Transaccion atomica: elimina inscription actual + crea nueva en equipo destino.
 */

import { eq, and } from "drizzle-orm";
import { db, teams, inscriptions } from "@/db";
import { apiSuccess, apiError } from "@/types";
import { TransferPlayerSchema } from "@/entities/team";
import { transferPlayer } from "@/features/team-management/actions";

type RouteParams = { params: Promise<{ id: string; memberId: string }> };

export async function POST(request: Request, { params }: RouteParams) {
	const { id: sourceTeamId, memberId } = await params;

	// Verificar que el jugador esta actualmente en este equipo
	const inscription = await db.query.inscriptions.findFirst({
		where: and(eq(inscriptions.teamId, sourceTeamId), eq(inscriptions.leagueMemberId, memberId)),
	});
	if (!inscription) return apiError("Jugador no encontrado en este equipo", 404);

	// Validar body
	const body = await request.json().catch(() => null);
	const parsed = TransferPlayerSchema.safeParse(body);
	if (!parsed.success) return apiError(parsed.error.message, 400);

	const { targetTeamId } = parsed.data;
	if (targetTeamId === sourceTeamId) return apiError("El equipo destino debe ser diferente", 400);

	// Verificar que el equipo destino pertenece a la misma liga
	const sourceTeam = await db.query.teams.findFirst({ where: eq(teams.id, sourceTeamId) });
	const targetTeam = await db.query.teams.findFirst({ where: eq(teams.id, targetTeamId) });

	if (!sourceTeam || !targetTeam) return apiError("Equipo no encontrado", 404);
	if (sourceTeam.leagueId !== targetTeam.leagueId) {
		return apiError("El equipo destino debe pertenecer a la misma liga", 400);
	}

	// Verificar que no este ya inscrito en el equipo destino
	const existingInscription = await db.query.inscriptions.findFirst({
		where: and(eq(inscriptions.teamId, targetTeamId), eq(inscriptions.leagueMemberId, memberId)),
	});
	if (existingInscription) return apiError("El jugador ya esta inscrito en ese equipo", 409);

	const newInscription = await transferPlayer(memberId, targetTeamId);
	return apiSuccess({ transferred: true, inscription: newInscription });
}
