/**
 * POST /api/leagues/[id]/schedule/preview
 * Corre Capa 1 (pairing generator) + Capa 2 (slot assigner) y devuelve preview JSON sin persistir.
 * Idempotente.
 */

import { apiSuccess, apiError, GenerateScheduleSchema } from "@/types";
import { getSessionUserFromRequest, canManageLeague } from "@/shared/lib/auth";
import { db } from "@/db";
import {
	leagues,
	teams,
	leagueSchedulingConfig,
	teamRestRequests,
	leagueVenues,
	venueTimeWindows,
	teamPurchasedTimeslots,
} from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { generatePairings } from "@/features/scheduling/pairing-generator/generate-pairings";
import { assignSlots } from "@/features/scheduling/slot-assigner/assign-slots";
import type { VenueWithWindows } from "@/features/scheduling/slot-assigner/assign-slots";
import type { PurchasedSlot } from "@/features/scheduling/slot-assigner/conflict-detector";
import type { DayOfWeek } from "@/db/schema";

type Params = { params: Promise<{ id: string }> };

function buildSeed(): number {
	return Math.floor(Math.random() * 2 ** 31);
}

export async function POST(request: Request, { params }: Params) {
	const session = await getSessionUserFromRequest(request);
	if (!session) return apiError("No autenticado", 401);

	const { id } = await params;

	const league = await db.query.leagues.findFirst({
		where: eq(leagues.id, id),
		columns: { id: true, organizationId: true, schedulingEnabled: true },
	});
	if (!league) return apiError("Liga no encontrada", 404);
	if (!league.schedulingEnabled)
		return apiError("El módulo de sorteo no está habilitado para esta liga", 400);
	if (!canManageLeague(session, league.organizationId ?? null)) return apiError("Sin permiso", 403);

	const [config, teamRows, restRows, venueRows, windowRows, purchasedRows] = await Promise.all([
		db.query.leagueSchedulingConfig.findFirst({ where: eq(leagueSchedulingConfig.leagueId, id) }),
		// 'pending' (banca) y 'disbanded' quedan fuera del sorteo — mismo trato
		// deportivo (NUEVA-TEMPORADA-V2.md §3.2).
		db
			.select({ id: teams.id })
			.from(teams)
			.where(and(eq(teams.leagueId, id), eq(teams.status, "active"))),
		db.query.teamRestRequests.findMany({ where: eq(teamRestRequests.leagueId, id) }),
		db
			.select({ venueId: leagueVenues.venueId, priority: leagueVenues.priority })
			.from(leagueVenues)
			.where(eq(leagueVenues.leagueId, id)),
		db.query.venueTimeWindows.findMany({
			where: eq(venueTimeWindows.leagueId, id),
			columns: { venueId: true, dayOfWeek: true, startTime: true, endTime: true, isActive: true },
		}),
		db.query.teamPurchasedTimeslots.findMany({
			where: eq(teamPurchasedTimeslots.leagueId, id),
			columns: { teamId: true, venueId: true, startTime: true },
		}),
	]);

	if (!config)
		return apiError("La liga no tiene configuración de sorteo. Configúrala primero.", 400);
	if (teamRows.length < 2)
		return apiError("Se necesitan al menos 2 equipos para generar el sorteo", 400);

	const body = await request.json().catch(() => ({}));
	const parsed = GenerateScheduleSchema.safeParse(body);
	if (!parsed.success) return apiError(parsed.error.message, 400);

	// Capa 1 — pairing generator
	const seed = config.lastSeed ?? buildSeed();
	const teamIds = teamRows.map((t) => t.id);
	const rests = restRows.map((r) => ({ teamId: r.teamId, matchdayNumber: r.matchdayNumber }));

	const pairingsResult = generatePairings({ teamIds, seed, restRequests: rests });
	if (!pairingsResult.ok) return apiError(pairingsResult.error, 422);

	// Capa 2 — slot assigner
	const venueWindowMap = new Map<string, VenueWithWindows>();
	for (const vr of venueRows) {
		venueWindowMap.set(vr.venueId, { venueId: vr.venueId, priority: vr.priority, windows: [] });
	}
	for (const w of windowRows) {
		if (!w.isActive) continue;
		venueWindowMap.get(w.venueId)?.windows.push({
			dayOfWeek: w.dayOfWeek as DayOfWeek,
			openTime: w.startTime,
			closeTime: w.endTime,
		});
	}
	const venues = [...venueWindowMap.values()];

	const purchased: PurchasedSlot[] = purchasedRows.map((p) => ({
		teamId: p.teamId,
		venueId: p.venueId ?? null,
		startTime: p.startTime,
		endTime: "", // enriquecido en assignSlots
	}));

	const slotResult = assignSlots({
		matchdays: pairingsResult.matchdays,
		startDate: parsed.data.startDate,
		durationMinutes: config.matchDurationMinutes,
		bufferMinutes: config.bufferMinutes,
		venues,
		purchasedSlots: purchased,
	});

	return apiSuccess({
		seed,
		startDate: parsed.data.startDate,
		matchdays: pairingsResult.matchdays,
		teamCount: teamIds.length,
		conflicts: slotResult.conflicts,
		unassigned: slotResult.unassigned,
		assigned: slotResult.assigned,
	});
}
