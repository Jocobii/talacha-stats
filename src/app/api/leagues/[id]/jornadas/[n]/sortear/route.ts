/**
 * POST /api/leagues/[id]/jornadas/[n]/sortear
 *
 * Genera pairings para la jornada n (preview sin persistir).
 */

import { z } from "zod";
import { apiSuccess, apiError } from "@/types";
import { getSessionUserFromRequest, canManageLeague } from "@/shared/lib/auth";
import { db } from "@/db";
import {
	leagues,
	matchdays,
	matches,
	teams,
	leagueSchedulingConfig,
	teamRestRequests,
	teamPurchasedTimeslots,
	leagueVenues,
	venueTimeWindows,
	venues,
} from "@/db/schema";
import { eq, and, inArray, asc } from "drizzle-orm";
import { generateSingleRound } from "@/features/scheduling/jornada/generate-single-round";
import { getRecentPairs } from "@/features/scheduling/jornada/get-recent-pairs";
import { assignSingleRoundSlots } from "@/features/scheduling/jornada/assign-single-round-slots";
import { pairKey } from "@/features/scheduling/lib/pair-key";
import type { DayOfWeek } from "@/db/schema";

type Params = { params: Promise<{ id: string; n: string }> };

const SortearSchema = z.object({
	seed: z.number().int().optional(),
});

const CLOSED_STATUSES = ["completed", "published"] as const;

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
		columns: { id: true, scheduledDate: true, status: true },
	});
	if (!matchday) return apiError("Jornada no encontrada", 404);

	const body = await request.json().catch(() => ({}));
	const parsed = SortearSchema.safeParse(body);
	if (!parsed.success) return apiError(parsed.error.message, 400);

	const [config, teamRows, restRows, venueRows, windowRows, purchasedRows] = await Promise.all([
		db.query.leagueSchedulingConfig.findFirst({
			where: eq(leagueSchedulingConfig.leagueId, id),
		}),
		db.select({ id: teams.id }).from(teams).where(eq(teams.leagueId, id)),
		db.query.teamRestRequests.findMany({
			where: and(
				eq(teamRestRequests.leagueId, id),
				eq(teamRestRequests.matchdayNumber, matchdayNumber),
			),
			columns: { teamId: true },
		}),
		db
			.select({ venueId: leagueVenues.venueId, priority: leagueVenues.priority })
			.from(leagueVenues)
			.where(eq(leagueVenues.leagueId, id)),
		db.query.venueTimeWindows.findMany({
			where: and(eq(venueTimeWindows.leagueId, id), eq(venueTimeWindows.isActive, true)),
			columns: { venueId: true, dayOfWeek: true, startTime: true, endTime: true },
		}),
		db.query.teamPurchasedTimeslots.findMany({
			where: eq(teamPurchasedTimeslots.leagueId, id),
			columns: { teamId: true, venueId: true, startTime: true },
		}),
	]);

	if (!config) return apiError("La liga no tiene configuración de sorteo", 400);

	const absentTeamIds = new Set(restRows.map((r) => r.teamId));
	const presentTeamIds = teamRows.map((t) => t.id).filter((tid) => !absentTeamIds.has(tid));

	if (presentTeamIds.length < 2) {
		return apiError("Se necesitan al menos 2 equipos presentes para sortear", 400);
	}

	// Cargar últimas N jornadas cerradas/publicadas para S4 deslizante
	const noRepeatWithin = config.noRepeatWithin;
	const recentMatchdays = await db.query.matchdays.findMany({
		where: and(eq(matchdays.leagueId, id), inArray(matchdays.status, [...CLOSED_STATUSES])),
		orderBy: [asc(matchdays.number)],
		columns: { id: true, number: true },
	});

	const closedInWindow = recentMatchdays
		.filter((md) => md.number < matchdayNumber)
		.slice(-noRepeatWithin);

	const recentMatchIds = closedInWindow.map((md) => md.id);
	const recentMatchPairings =
		recentMatchIds.length > 0
			? await db
					.select({
						homeTeamId: matches.homeTeamId,
						awayTeamId: matches.awayTeamId,
						matchdayId: matches.matchdayId,
					})
					.from(matches)
					.where(inArray(matches.matchdayId, recentMatchIds))
			: [];

	const recentByMatchday = closedInWindow.map((md) => ({
		pairings: recentMatchPairings
			.filter((m) => m.matchdayId === md.id)
			.map((m) => ({ homeTeamId: m.homeTeamId, awayTeamId: m.awayTeamId })),
	}));

	const recentPairKeys = getRecentPairs(recentByMatchday);

	const seed = parsed.data.seed ?? Math.floor(Math.random() * 2 ** 31);

	const purchasedSlots = purchasedRows.map((p) => ({
		teamId: p.teamId,
		venueId: p.venueId ?? null,
		startTime: p.startTime,
	}));

	const { pairings, conflicts } = generateSingleRound({
		presentTeamIds,
		seed,
		recentPairKeys,
		purchasedSlots,
	});

	// Construir venues con ventanas
	const venueWindowMap = new Map<
		string,
		{
			venueId: string;
			priority: number;
			windows: { dayOfWeek: DayOfWeek; openTime: string; closeTime: string }[];
		}
	>();
	for (const vr of venueRows) {
		venueWindowMap.set(vr.venueId, { venueId: vr.venueId, priority: vr.priority, windows: [] });
	}
	for (const w of windowRows) {
		venueWindowMap.get(w.venueId)?.windows.push({
			dayOfWeek: w.dayOfWeek as DayOfWeek,
			openTime: w.startTime,
			closeTime: w.endTime,
		});
	}

	// Cargar nombres de venues para la respuesta
	const venueIds = venueRows.map((v) => v.venueId);
	const venueNameRows =
		venueIds.length > 0
			? await db
					.select({ id: venues.id, name: venues.name })
					.from(venues)
					.where(inArray(venues.id, venueIds))
			: [];
	const venueNameMap = new Map(venueNameRows.map((v) => [v.id, v.name]));

	const assigned = assignSingleRoundSlots({
		pairings,
		scheduledDate: matchday.scheduledDate,
		durationMinutes: config.matchDurationMinutes,
		bufferMinutes: config.bufferMinutes,
		venues: [...venueWindowMap.values()],
		purchasedSlots: purchasedSlots.map((p) => ({
			teamId: p.teamId,
			venueId: p.venueId,
			startTime: p.startTime,
			endTime: "",
		})),
	});

	const conflictKeys = new Set(conflicts.map((c) => pairKey(c.homeTeamId, c.awayTeamId)));

	const byeTeamId = pairings.find((p) => p.awayTeamId === null)?.homeTeamId ?? null;

	const pairingsOut = assigned
		.map((a) => ({
			homeTeamId: a.homeTeamId,
			awayTeamId: a.awayTeamId,
			venueId: a.venueId,
			venueName: a.venueId ? (venueNameMap.get(a.venueId) ?? null) : null,
			startTime: a.startTime,
			isConflict: a.awayTeamId !== null && conflictKeys.has(pairKey(a.homeTeamId, a.awayTeamId)),
		}))
		.sort((a, b) => {
			if (!a.startTime && !b.startTime) return 0;
			if (!a.startTime) return 1;
			if (!b.startTime) return -1;
			return a.startTime.localeCompare(b.startTime);
		});

	return apiSuccess({
		seed,
		pairings: pairingsOut,
		conflicts,
		presentCount: presentTeamIds.length,
		byeTeamId,
	});
}
