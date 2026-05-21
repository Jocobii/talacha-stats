/**
 * GET /api/leagues/[id]/jornadas/[n]/roster
 *
 * Lista todos los equipos de la liga con su estado de asistencia para la jornada n.
 * También devuelve matchesPlayed por equipo y allRecentPairKeys para validar doble jornada.
 */

import { apiSuccess, apiError } from "@/types";
import { getSessionUserFromRequest, canManageLeague } from "@/shared/lib/auth";
import { db } from "@/db";
import {
	leagues,
	matchdays,
	matches,
	teams,
	teamRestRequests,
	teamPurchasedTimeslots,
	venues,
	leagueSchedulingConfig,
} from "@/db/schema";
import { eq, and, inArray, asc, isNotNull } from "drizzle-orm";
import { getRecentPairs } from "@/features/scheduling/jornada/get-recent-pairs";

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

	const [teamRows, restRows, purchasedRows, config, closedMatchdays] = await Promise.all([
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
		db.query.leagueSchedulingConfig.findFirst({
			where: eq(leagueSchedulingConfig.leagueId, id),
			columns: { noRepeatWithin: true, regularMatchdays: true },
		}),
		db.query.matchdays.findMany({
			where: and(eq(matchdays.leagueId, id), inArray(matchdays.status, ["completed", "published"])),
			orderBy: [asc(matchdays.number)],
			columns: { id: true, number: true },
		}),
	]);

	// Solo jornadas anteriores a la actual
	const closedBeforeCurrent = closedMatchdays.filter((md) => md.number < matchdayNumber);
	const closedIds = closedBeforeCurrent.map((md) => md.id);

	// Contar partidos jugados por equipo en jornadas cerradas
	const matchesPlayedMap = new Map<string, number>();
	if (closedIds.length > 0) {
		const closedMatches = await db
			.select({ homeTeamId: matches.homeTeamId, awayTeamId: matches.awayTeamId })
			.from(matches)
			.where(and(inArray(matches.matchdayId, closedIds), isNotNull(matches.awayTeamId)));

		for (const m of closedMatches) {
			matchesPlayedMap.set(m.homeTeamId, (matchesPlayedMap.get(m.homeTeamId) ?? 0) + 1);
			if (m.awayTeamId) {
				matchesPlayedMap.set(m.awayTeamId, (matchesPlayedMap.get(m.awayTeamId) ?? 0) + 1);
			}
		}
	}

	// Recent pair keys de las últimas noRepeatWithin jornadas cerradas
	const noRepeatWithin = config?.noRepeatWithin ?? 3;
	const closedInWindow = closedBeforeCurrent.slice(-noRepeatWithin);
	const windowIds = closedInWindow.map((md) => md.id);

	const recentMatchPairings =
		windowIds.length > 0
			? await db
					.select({
						homeTeamId: matches.homeTeamId,
						awayTeamId: matches.awayTeamId,
						matchdayId: matches.matchdayId,
					})
					.from(matches)
					.where(and(inArray(matches.matchdayId, windowIds), isNotNull(matches.awayTeamId)))
			: [];

	const recentByMatchday = closedInWindow.map((md) => ({
		pairings: recentMatchPairings
			.filter((m) => m.matchdayId === md.id && m.awayTeamId !== null)
			.map((m) => ({ homeTeamId: m.homeTeamId, awayTeamId: m.awayTeamId! })),
	}));

	const allRecentPairKeys = [...getRecentPairs(recentByMatchday)];

	const restByTeam = new Map(restRows.map((r) => [r.teamId, r.reason ?? null]));
	const purchasedByTeam = new Map(
		purchasedRows.map((p) => [
			p.teamId,
			{ venueId: p.venueId ?? null, venueName: p.venueName ?? null, startTime: p.startTime },
		]),
	);

	const result = teamRows.map((t) => {
		const isAbsent = restByTeam.has(t.id);
		const slot = purchasedByTeam.get(t.id) ?? null;
		return {
			id: t.id,
			name: t.name,
			color: t.color ?? null,
			short: null as string | null,
			status: isAbsent ? ("ausente" as const) : ("presente" as const),
			restReason: isAbsent ? (restByTeam.get(t.id) ?? null) : null,
			purchasedSlot: slot
				? { venueId: slot.venueId, venueName: slot.venueName ?? "", startTime: slot.startTime }
				: null,
			matchesPlayed: matchesPlayedMap.get(t.id) ?? 0,
		};
	});

	return apiSuccess({ matchdayId: matchday.id, teams: result, allRecentPairKeys });
}
