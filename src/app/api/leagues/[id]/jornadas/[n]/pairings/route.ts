/**
 * GET  /api/leagues/[id]/jornadas/[n]/pairings
 * PATCH /api/leagues/[id]/jornadas/[n]/pairings
 *
 * GET  → devuelve los partidos ya confirmados de la jornada como CockpitPairing[].
 *        Permite que el cockpit restaure el estado editable al reabrir una jornada.
 * PATCH → actualiza los pairings existentes (swap, cambio de venue/hora).
 *         Aplica para jornadas en draft, published o in_progress.
 */

import { z } from "zod";
import { apiSuccess, apiError } from "@/types";
import { getSessionUserFromRequest, canManageLeague } from "@/shared/lib/auth";
import { db } from "@/db";
import { leagues, matchdays, matches, teamRestRequests } from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { confirmSingleRound } from "@/features/scheduling/jornada/confirm-single-round";

type Params = { params: Promise<{ id: string; n: string }> };

/**
 * Extrae "HH:MM" de kickoffAt en hora LOCAL del servidor.
 * Consistente con buildKickoffAt (crea Date sin timezone = hora local) y con
 * MatchdayCard.formatTime (usa toLocaleTimeString = hora local).
 * ⚠️ NO usar toISOString() — devuelve UTC y desincroniza con los slots del venue.
 */
function toStartTime(kickoffAt: Date | null): string | null {
	if (!kickoffAt) return null;
	const h = kickoffAt.getHours().toString().padStart(2, "0");
	const m = kickoffAt.getMinutes().toString().padStart(2, "0");
	return `${h}:${m}`;
}

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET(request: Request, { params }: Params) {
	const session = await getSessionUserFromRequest(request);
	if (!session) return apiError("No autenticado", 401);

	const { id, n } = await params;
	const matchdayNumber = parseInt(n, 10);
	if (isNaN(matchdayNumber) || matchdayNumber < 1)
		return apiError("Numero de jornada invalido", 400);

	const league = await db.query.leagues.findFirst({
		where: eq(leagues.id, id),
		columns: { id: true, organizationId: true, schedulingEnabled: true },
	});
	if (!league) return apiError("Liga no encontrada", 404);
	if (!league.schedulingEnabled) return apiError("Modulo de sorteo no habilitado", 400);
	if (!canManageLeague(session, league.organizationId ?? null)) return apiError("Sin permiso", 403);

	const matchday = await db.query.matchdays.findFirst({
		where: and(eq(matchdays.leagueId, id), eq(matchdays.number, matchdayNumber)),
		columns: { id: true },
	});
	if (!matchday) return apiError("Jornada no encontrada", 404);

	const rows = await db.query.matches.findMany({
		where: and(eq(matches.matchdayId, matchday.id), eq(matches.leagueId, id)),
		columns: {
			id: true,
			homeTeamId: true,
			awayTeamId: true,
			venueId: true,
			kickoffAt: true,
		},
		orderBy: [asc(matches.kickoffAt), asc(matches.id)],
	});

	const pairings = rows.map((m, i) => ({
		uid: m.id,
		homeTeamId: m.homeTeamId,
		awayTeamId: m.awayTeamId,
		venueId: m.venueId ?? null,
		startTime: toStartTime(m.kickoffAt),
		isConflict: false,
		sortIndex: i,
	}));

	return apiSuccess({ pairings });
}

const PairingSchema = z.object({
	homeTeamId: z.string().uuid(),
	awayTeamId: z.string().uuid().nullable(),
	venueId: z.string().uuid().nullable(),
	startTime: z
		.string()
		.regex(/^\d{2}:\d{2}$/)
		.nullable(),
});

const PairingsUpdateSchema = z.object({
	seed: z.number().int(),
	pairings: z.array(PairingSchema).min(1),
});

const EDITABLE_STATUSES = ["draft", "published", "in_progress"] as const;

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
		columns: { id: true, status: true, scheduledDate: true },
	});
	if (!matchday) return apiError("Jornada no encontrada", 404);
	if (!EDITABLE_STATUSES.includes(matchday.status as (typeof EDITABLE_STATUSES)[number])) {
		return apiError(
			"Solo se puede editar pairings en jornadas draft, published o in_progress",
			400,
		);
	}

	const body = await request.json().catch(() => ({}));
	const parsed = PairingsUpdateSchema.safeParse(body);
	if (!parsed.success) return apiError(parsed.error.message, 400);

	const { pairings } = parsed.data;

	// Invariante: ningún teamId aparece dos veces
	const teamIds = pairings.flatMap((p) =>
		p.awayTeamId ? [p.homeTeamId, p.awayTeamId] : [p.homeTeamId],
	);
	if (new Set(teamIds).size !== teamIds.length) {
		return apiError("Invariante violada: equipo duplicado en los pairings", 422);
	}

	// Todos los equipos son presentes (sin rest_request)
	const restRows = await db.query.teamRestRequests.findMany({
		where: and(
			eq(teamRestRequests.leagueId, id),
			eq(teamRestRequests.matchdayNumber, matchdayNumber),
		),
		columns: { teamId: true },
	});
	const absentSet = new Set(restRows.map((r) => r.teamId));
	const absentInPairings = teamIds.filter((tid) => absentSet.has(tid));
	if (absentInPairings.length > 0) {
		return apiError(`Equipos ausentes incluidos en pairings: ${absentInPairings.join(", ")}`, 422);
	}

	await confirmSingleRound({
		matchdayId: matchday.id,
		leagueId: id,
		scheduledDate: matchday.scheduledDate,
		pairings,
	});

	const warnings: string[] = [];
	if (matchday.status === "in_progress") {
		const hasVenueOrTimeChange = pairings.some((p) => p.venueId !== null || p.startTime !== null);
		if (hasVenueOrTimeChange) {
			warnings.push(
				"La jornada está en progreso. Cambios de cancha/hora aplicados pero los partidos pueden haber comenzado.",
			);
		}
	}

	return apiSuccess({ matchdayId: matchday.id, pairingsCount: pairings.length, warnings });
}
