/**
 * POST /api/leagues/[id]/jornadas/[n]/confirm
 *
 * Persiste los pairings editados para la jornada n.
 * Valida invariantes antes de persistir. Guarda el seed usado.
 */

import { z } from "zod";
import { apiSuccess, apiError } from "@/types";
import { getSessionUserFromRequest, canManageLeague } from "@/shared/lib/auth";
import { db } from "@/db";
import { leagues, matchdays, teamRestRequests, leagueSchedulingConfig } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { confirmSingleRound } from "@/features/scheduling/jornada/confirm-single-round";

type Params = { params: Promise<{ id: string; n: string }> };

const PairingSchema = z.object({
	homeTeamId: z.string().uuid(),
	awayTeamId: z.string().uuid().nullable(),
	venueId: z.string().uuid().nullable(),
	startTime: z
		.string()
		.regex(/^\d{2}:\d{2}$/)
		.nullable(),
});

const ConfirmSchema = z.object({
	seed: z.number().int(),
	pairings: z.array(PairingSchema).min(1),
});

const EDITABLE_STATUSES = ["draft", "published"] as const;

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
		columns: { id: true, status: true, scheduledDate: true },
	});
	if (!matchday) return apiError("Jornada no encontrada", 404);
	if (!EDITABLE_STATUSES.includes(matchday.status as (typeof EDITABLE_STATUSES)[number])) {
		return apiError("Solo se puede confirmar en jornadas draft o published", 400);
	}

	const body = await request.json().catch(() => ({}));
	const parsed = ConfirmSchema.safeParse(body);
	if (!parsed.success) return apiError(parsed.error.message, 400);

	const { seed, pairings } = parsed.data;

	// Invariante: ningún equipo juega contra sí mismo, y ningún par (A,B) aparece dos veces
	// (permite doble jornada: un equipo puede aparecer en varios partidos contra distintos rivales)
	const pairKeys = new Set<string>();
	for (const p of pairings) {
		if (p.awayTeamId && p.homeTeamId === p.awayTeamId) {
			return apiError("Invariante violada: equipo contra sí mismo", 422);
		}
		if (p.awayTeamId) {
			const key = [p.homeTeamId, p.awayTeamId].sort().join("|");
			if (pairKeys.has(key)) {
				return apiError("Invariante violada: rival duplicado en la misma jornada", 422);
			}
			pairKeys.add(key);
		}
	}

	const teamIds = pairings.flatMap((p) =>
		p.awayTeamId ? [p.homeTeamId, p.awayTeamId] : [p.homeTeamId],
	);

	// Todos los equipos son presentes (sin rest_request)
	const restRows = await db.query.teamRestRequests.findMany({
		where: and(
			eq(teamRestRequests.leagueId, id),
			eq(teamRestRequests.matchdayNumber, matchdayNumber),
		),
		columns: { teamId: true },
	});
	const absentSet = new Set(restRows.map((r) => r.teamId));
	// Deduplicar teamIds antes de verificar ausentes (un equipo puede aparecer en múltiples partidos)
	const uniqueTeamIds = [...new Set(teamIds)];
	const absentInPairings = uniqueTeamIds.filter((tid) => absentSet.has(tid));
	if (absentInPairings.length > 0) {
		return apiError(`Equipos ausentes incluidos en pairings: ${absentInPairings.join(", ")}`, 422);
	}

	await confirmSingleRound({
		matchdayId: matchday.id,
		leagueId: id,
		scheduledDate: matchday.scheduledDate,
		pairings,
	});

	// Guardar seed
	await db
		.update(leagueSchedulingConfig)
		.set({ lastSeed: seed, updatedAt: new Date() })
		.where(eq(leagueSchedulingConfig.leagueId, id));

	return apiSuccess({ matchdayId: matchday.id, seed, pairingsCount: pairings.length });
}
