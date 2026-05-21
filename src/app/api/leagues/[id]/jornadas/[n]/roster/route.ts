/**
 * GET /api/leagues/[id]/jornadas/[n]/roster
 *
 * Lista todos los equipos de la liga con su estado de asistencia para la jornada n.
 */

import { apiSuccess, apiError } from "@/types";
import { getSessionUserFromRequest, canManageLeague } from "@/shared/lib/auth";
import { db } from "@/db";
import {
	leagues,
	matchdays,
	teams,
	teamRestRequests,
	teamPurchasedTimeslots,
	venues,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";

type Params = { params: Promise<{ id: string; n: string }> };

export async function GET(request: Request, { params }: Params) {
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
		columns: { id: true },
	});
	if (!matchday) return apiError("Jornada no encontrada", 404);

	const [teamRows, restRows, purchasedRows] = await Promise.all([
		db.query.teams.findMany({
			where: and(eq(teams.leagueId, id), eq(teams.status, "active")),
			columns: { id: true, name: true, color: true },
		}),
		db.query.teamRestRequests.findMany({
			where: and(
				eq(teamRestRequests.leagueId, id),
				eq(teamRestRequests.matchdayNumber, matchdayNumber),
			),
			columns: { teamId: true, reason: true },
		}),
		db
			.select({
				teamId: teamPurchasedTimeslots.teamId,
				venueId: teamPurchasedTimeslots.venueId,
				startTime: teamPurchasedTimeslots.startTime,
				venueName: venues.name,
			})
			.from(teamPurchasedTimeslots)
			.leftJoin(venues, eq(teamPurchasedTimeslots.venueId, venues.id))
			.where(eq(teamPurchasedTimeslots.leagueId, id)),
	]);

	const restByTeam = new Map(restRows.map((r) => [r.teamId, r.reason ?? null]));
	const purchasedByTeam = new Map(
		purchasedRows.map((p) => [
			p.teamId,
			{
				venueId: p.venueId ?? null,
				venueName: p.venueName ?? null,
				startTime: p.startTime,
			},
		]),
	);

	const result = teamRows.map((t) => {
		const isAbsent = restByTeam.has(t.id);
		const slot = purchasedByTeam.get(t.id) ?? null;
		return {
			id: t.id,
			name: t.name,
			color: t.color ?? null,
			short: null as string | null, // campo no existe aún en schema
			status: isAbsent ? ("ausente" as const) : ("presente" as const),
			restReason: isAbsent ? (restByTeam.get(t.id) ?? null) : null,
			purchasedSlot: slot
				? {
						venueId: slot.venueId,
						venueName: slot.venueName ?? "",
						startTime: slot.startTime,
					}
				: null,
		};
	});

	return apiSuccess({ matchdayId: matchday.id, teams: result });
}
