/**
 * GET /api/leagues/[id]/sorteo/current
 *
 * Devuelve la jornada activa (menor número con status draft|published, phase=regular)
 * junto con config de la liga, venues y conteo de partidos ya persistidos.
 */

import { apiSuccess, apiError } from "@/types";
import { getSessionUserFromRequest, canManageLeague } from "@/shared/lib/auth";
import { db } from "@/db";
import {
	leagues,
	matchdays,
	matches,
	leagueSchedulingConfig,
	leagueVenues,
	venues,
	venueTimeWindows,
} from "@/db/schema";
import { eq, and, inArray, asc, desc, count } from "drizzle-orm";
import { MATCHDAY_STATUSES } from "@/features/scheduling/constants";
import {
	buildSlotsForDay,
	spanishDayFromIso,
	type VenueWindow,
} from "@/features/scheduling/slot-assigner/build-slots";
import type { DayOfWeek } from "@/db/schema";

type Params = { params: Promise<{ id: string }> };

const ACTIVE_STATUSES: (typeof MATCHDAY_STATUSES)[number][] = ["draft", "published"];

export async function GET(request: Request, { params }: Params) {
	const session = await getSessionUserFromRequest(request);
	if (!session) return apiError("No autenticado", 401);

	const { id } = await params;

	const league = await db.query.leagues.findFirst({
		where: eq(leagues.id, id),
		columns: { id: true, name: true, organizationId: true, schedulingEnabled: true },
	});
	if (!league) return apiError("Liga no encontrada", 404);
	if (!league.schedulingEnabled) return apiError("Módulo de sorteo no habilitado", 400);
	if (!canManageLeague(session, league.organizationId ?? null)) return apiError("Sin permiso", 403);

	const [config, activeDays] = await Promise.all([
		db.query.leagueSchedulingConfig.findFirst({
			where: eq(leagueSchedulingConfig.leagueId, id),
		}),
		db.query.matchdays.findMany({
			where: and(
				eq(matchdays.leagueId, id),
				eq(matchdays.phase, "regular"),
				inArray(matchdays.status, ACTIVE_STATUSES),
			),
			orderBy: [asc(matchdays.number)],
			columns: { id: true, number: true, scheduledDate: true, status: true },
			limit: 1,
		}),
	]);

	const currentMatchday = activeDays[0] ?? null;

	// Si no hay jornada activa, buscar la última completada para sugerir la fecha siguiente (+7 días)
	let suggestedNextDate: string | null = null;
	if (!currentMatchday) {
		const lastCompleted = await db.query.matchdays.findFirst({
			where: and(eq(matchdays.leagueId, id), eq(matchdays.status, "completed")),
			orderBy: [desc(matchdays.number)],
			columns: { scheduledDate: true },
		});
		if (lastCompleted?.scheduledDate) {
			const [y, m, d] = lastCompleted.scheduledDate.split("-").map(Number);
			const next = new Date(y, m - 1, d + 7);
			suggestedNextDate = [
				next.getFullYear(),
				String(next.getMonth() + 1).padStart(2, "0"),
				String(next.getDate()).padStart(2, "0"),
			].join("-");
		}
	}

	let matchCount = 0;
	if (currentMatchday) {
		const [countRow] = await db
			.select({ total: count() })
			.from(matches)
			.where(eq(matches.matchdayId, currentMatchday.id));
		matchCount = countRow?.total ?? 0;
	}

	// Cargar venues y sus ventanas horarias
	const venueRows = await db
		.select({
			venueId: leagueVenues.venueId,
			priority: leagueVenues.priority,
			name: venues.name,
		})
		.from(leagueVenues)
		.innerJoin(venues, eq(leagueVenues.venueId, venues.id))
		.where(eq(leagueVenues.leagueId, id));

	const windowRows = await db.query.venueTimeWindows.findMany({
		where: and(eq(venueTimeWindows.leagueId, id), eq(venueTimeWindows.isActive, true)),
		columns: { venueId: true, dayOfWeek: true, startTime: true, endTime: true },
	});

	// Agrupar ventanas por venue con el tipo que espera buildSlotsForDay
	const windowsByVenue = new Map<string, VenueWindow[]>();
	for (const w of windowRows) {
		const list = windowsByVenue.get(w.venueId) ?? [];
		list.push({ dayOfWeek: w.dayOfWeek as DayOfWeek, openTime: w.startTime, closeTime: w.endTime });
		windowsByVenue.set(w.venueId, list);
	}

	// Duracion y buffer desde config
	const duration = config?.matchDurationMinutes ?? 60;
	const buffer = config?.bufferMinutes ?? 0;

	const venuesOut = venueRows.map((v) => {
		const windows = windowsByVenue.get(v.venueId) ?? [];
		let startTimes: string[];

		if (currentMatchday && currentMatchday.scheduledDate) {
			const dayOfWeek = spanishDayFromIso(currentMatchday.scheduledDate);
			startTimes = buildSlotsForDay(v.venueId, windows, dayOfWeek, duration, buffer).map(
				(s) => s.startTime,
			);
		} else {
			const allSlots = windows.flatMap((w) =>
				buildSlotsForDay(v.venueId, [w], w.dayOfWeek, duration, buffer).map((s) => s.startTime),
			);
			startTimes = [...new Set(allSlots)].sort();
		}

		return { id: v.venueId, name: v.name, slots: startTimes };
	});

	return apiSuccess({
		matchday: currentMatchday
			? {
					id: currentMatchday.id,
					number: currentMatchday.number,
					scheduledDate: currentMatchday.scheduledDate,
					status: currentMatchday.status,
					matchCount,
				}
			: null,
		suggestedNextDate,
		totalMatchdays: config?.regularMatchdays ?? 0,
		leagueName: league.name,
		venues: venuesOut,
		config: config
			? {
					matchDurationMinutes: config.matchDurationMinutes,
					bufferMinutes: config.bufferMinutes,
					noRepeatWithin: config.noRepeatWithin,
					regularMatchdays: config.regularMatchdays,
					allowDuplicateMatchups: config.allowDuplicateMatchups,
				}
			: null,
	});
}
