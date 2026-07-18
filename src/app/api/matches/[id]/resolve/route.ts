/**
 * POST /api/matches/[id]/resolve
 * Persistencia completa de la resolución de un partido.
 * Retorna nextMatchId para el flujo "Guardar y siguiente".
 */
import { apiSuccess, apiError } from "@/types";
import { getSessionUserFromRequest, canManageLeague } from "@/shared/lib/auth";
import { db } from "@/db";
import { matches } from "@/db/schema";
import { eq } from "drizzle-orm";
import { resolveMatch } from "@/features/match-resolution/resolve-match";
import { getNextScheduledMatch, getNextScheduledPlayoffMatch } from "@/entities/match/queries";
import { ResolveMatchSchema } from "@/entities/match/model";
import { propagatePlayoffWinner } from "@/features/playoffs/lib/winner-propagator";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
	const session = await getSessionUserFromRequest(request);
	if (!session) return apiError("No autenticado", 401);

	const { id } = await params;

	const match = await db.query.matches.findFirst({
		where: eq(matches.id, id),
		with: { league: { columns: { organizationId: true } } },
		columns: { id: true, matchdayId: true },
	});
	if (!match) return apiError("Partido no encontrado", 404);
	if (!canManageLeague(session, match.league?.organizationId ?? null)) {
		return apiError("Sin permiso", 403);
	}

	const body = await request.json().catch(() => ({}));
	const parsed = ResolveMatchSchema.safeParse(body);
	if (!parsed.success) return apiError(parsed.error.message, 400);

	await resolveMatch(id, parsed.data, session.id);

	// Propagate playoff winner if this match belongs to a bracket slot. `playoffRound`
	// queda null para partidos regulares (sin playoff_slot) — en ese caso el "siguiente
	// partido" se calcula igual que siempre. Si SÍ es un partido de playoff, acotamos el
	// auto-avance a la MISMA ronda: sin esto, en cuanto se resuelve el último partido de
	// una ronda, propagatePlayoffWinner puede crear al instante el partido de la ronda
	// siguiente y el flujo "Guardar y siguiente" saltaría ahí sin que se haya jugado.
	let playoffRound: number | null = null;
	if (
		parsed.data.status === "played" ||
		parsed.data.status === "walkover_home" ||
		parsed.data.status === "walkover_away"
	) {
		const homeScore = parsed.data.homeScore ?? 0;
		const awayScore = parsed.data.awayScore ?? 0;
		const propagateResult = await propagatePlayoffWinner(id, homeScore, awayScore);
		playoffRound = propagateResult.round;
	}

	const nextMatch = match.matchdayId
		? playoffRound !== null
			? await getNextScheduledPlayoffMatch(match.matchdayId, id, playoffRound)
			: await getNextScheduledMatch(match.matchdayId, id)
		: null;

	return apiSuccess({ nextMatchId: nextMatch?.id ?? null });
}
