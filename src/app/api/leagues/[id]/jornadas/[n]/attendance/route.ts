/**
 * PATCH /api/leagues/[id]/jornadas/[n]/attendance
 *
 * Cambia el estado de asistencia de un equipo para la jornada n.
 * ausente → upsert teamRestRequest | presente → delete teamRestRequest
 */

import { z } from "zod";
import { apiSuccess, apiError } from "@/types";
import { getSessionUserFromRequest, canManageLeague } from "@/shared/lib/auth";
import { db } from "@/db";
import { leagues, matchdays, teams, teamRestRequests } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { MATCHDAY_STATUSES } from "@/features/scheduling/constants";

type Params = { params: Promise<{ id: string; n: string }> };

const AttendanceSchema = z.object({
	teamId: z.string().uuid(),
	status: z.enum(["presente", "ausente"]),
	reason: z.string().max(500).optional(),
});

const EDITABLE_STATUSES: (typeof MATCHDAY_STATUSES)[number][] = ["draft", "published"];

export async function PATCH(request: Request, { params }: Params) {
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
	if (!EDITABLE_STATUSES.includes(matchday.status as (typeof EDITABLE_STATUSES)[number])) {
		return apiError("Solo se puede modificar asistencia en jornadas draft o published", 400);
	}

	const body = await request.json().catch(() => ({}));
	const parsed = AttendanceSchema.safeParse(body);
	if (!parsed.success) return apiError(parsed.error.message, 400);

	const { teamId, status, reason } = parsed.data;

	// Verificar que el equipo pertenece a la liga
	const team = await db.query.teams.findFirst({
		where: and(eq(teams.id, teamId), eq(teams.leagueId, id)),
		columns: { id: true },
	});
	if (!team) return apiError("Equipo no encontrado en esta liga", 404);

	if (status === "ausente") {
		await db
			.insert(teamRestRequests)
			.values({ teamId, leagueId: id, matchdayNumber, reason: reason ?? null })
			.onConflictDoUpdate({
				target: [
					teamRestRequests.teamId,
					teamRestRequests.leagueId,
					teamRestRequests.matchdayNumber,
				],
				set: { reason: reason ?? null },
			});
	} else {
		await db
			.delete(teamRestRequests)
			.where(
				and(
					eq(teamRestRequests.teamId, teamId),
					eq(teamRestRequests.leagueId, id),
					eq(teamRestRequests.matchdayNumber, matchdayNumber),
				),
			);
	}

	return apiSuccess({ teamId, status });
}
