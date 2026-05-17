/**
 * POST /api/leagues/[id]/schedule/confirm
 * Persiste el sorteo completo en una transacción atómica:
 *   1. Corre Capa 1 (pairing generator) + Capa 2 (slot assigner)
 *   2. Inserta `matchdays` (draft) + `matches` (scheduled)
 *   3. Guarda el seed usado en leagueSchedulingConfig.lastSeed
 *
 * Idempotencia: elimina matchdays draft existentes antes de reinsertar.
 * Partidos BYE (awayTeamId === null) no se persisten en `matches`.
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
	matchdays,
	matches,
} from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { generatePairings } from "@/features/scheduling/pairing-generator/generate-pairings";
import {
	assignSlots,
	type VenueWithWindows,
} from "@/features/scheduling/slot-assigner/assign-slots";
import type { PurchasedSlot } from "@/features/scheduling/slot-assigner/conflict-detector";
import type { AssignedMatch } from "@/features/scheduling/types";
import type { DayOfWeek } from "@/db/schema";

type Params = { params: Promise<{ id: string }> };

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
		db.select({ id: teams.id }).from(teams).where(eq(teams.leagueId, id)),
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
	const seed = config.lastSeed ?? Math.floor(Math.random() * 2 ** 31);
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

	const purchased: PurchasedSlot[] = purchasedRows.map((p) => ({
		teamId: p.teamId,
		venueId: p.venueId ?? null,
		startTime: p.startTime,
		endTime: "",
	}));

	const slotResult = assignSlots({
		matchdays: pairingsResult.matchdays,
		startDate: parsed.data.startDate,
		durationMinutes: config.matchDurationMinutes,
		bufferMinutes: config.bufferMinutes,
		venues: [...venueWindowMap.values()],
		purchasedSlots: purchased,
	});

	// Persist in a single transaction
	const { startDate } = parsed.data;
	const assignedByKey = buildAssignedIndex(slotResult.assigned);

	await db.transaction(async (tx) => {
		// 1. Borrar matchdays draft previos (idempotencia)
		const existingDraft = await tx
			.select({ id: matchdays.id })
			.from(matchdays)
			.where(and(eq(matchdays.leagueId, id), eq(matchdays.status, "draft")));

		if (existingDraft.length > 0) {
			const draftIds = existingDraft.map((r) => r.id);
			await tx.delete(matches).where(inArray(matches.matchdayId, draftIds));
			await tx.delete(matchdays).where(inArray(matchdays.id, draftIds));
		}

		// 2. Insertar matchdays
		for (const md of pairingsResult.matchdays) {
			const scheduledDate = matchdayDate(startDate, md.number);

			const [inserted] = await tx
				.insert(matchdays)
				.values({
					leagueId: id,
					number: md.number,
					phase: md.phase,
					scheduledDate,
					status: "draft",
				})
				.returning({ id: matchdays.id });

			if (!inserted) continue;

			// 3. Insertar partidos reales (no BYE).
			// Doble guarda: awayTeamId != null Y homeTeamId != null (loose, cubre undefined).
			const matchValues = md.pairings
				.filter((p) => p.homeTeamId != null && p.awayTeamId != null)
				.map((p) => {
					const key = pairingKey(p.homeTeamId, p.awayTeamId!);
					const assigned = assignedByKey.get(key);
					return {
						leagueId: id,
						homeTeamId: p.homeTeamId,
						awayTeamId: p.awayTeamId!,
						matchDate: scheduledDate,
						matchdayId: inserted.id,
						venueId: assigned?.slot.venueId || null,
						kickoffAt: assigned ? buildKickoffAt(scheduledDate, assigned.slot.startTime) : null,
						status: "scheduled" as const,
					};
				});

			if (matchValues.length > 0) {
				await tx.insert(matches).values(matchValues);
			}
		}

		// 4. Guardar seed
		await tx
			.update(leagueSchedulingConfig)
			.set({ lastSeed: seed, updatedAt: new Date() })
			.where(eq(leagueSchedulingConfig.leagueId, id));
	});

	return apiSuccess(
		{
			seed,
			startDate,
			matchdayCount: pairingsResult.matchdays.length,
			teamCount: teamIds.length,
			conflictCount: slotResult.conflicts.length,
			unassignedCount: slotResult.unassigned.length,
		},
		201,
	);
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildAssignedIndex(assigned: AssignedMatch[]): Map<string, AssignedMatch> {
	const map = new Map<string, AssignedMatch>();
	for (const a of assigned) {
		map.set(pairingKey(a.pairing.homeTeamId, a.pairing.awayTeamId!), a);
	}
	return map;
}

function pairingKey(homeId: string, awayId: string): string {
	return `${homeId}::${awayId}`;
}

/** Calcula la fecha de una jornada: jornada 1 = startDate, +7 días por jornada. */
function matchdayDate(startDate: string, matchdayNumber: number): string {
	const date = new Date(`${startDate}T00:00`);
	date.setDate(date.getDate() + (matchdayNumber - 1) * 7);
	return date.toISOString().slice(0, 10);
}

/** Combina una fecha "YYYY-MM-DD" y una hora "HH:MM" en un Date. */
function buildKickoffAt(isoDate: string, time: string): Date {
	return new Date(`${isoDate}T${time}:00`);
}
