/**
 * POST /api/leagues/[id]/playoffs/fix-match-assignments
 *
 * Corrige los partidos de fase final que quedaron asignados a una jornada
 * regular por error (bug en winner-propagator que no filtraba por phase).
 *
 * Encuentra todos los partidos vinculados a playoff_slots de esta liga
 * y actualiza su matchdayId al playoff sentinel (phase=playoff).
 */
import { apiSuccess, apiError } from "@/types";
import { getSessionUserFromRequest, canManageLeague } from "@/shared/lib/auth";
import { db } from "@/db";
import { leagues, matchdays, matches, playoffSlots, playoffBrackets } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
	const session = await getSessionUserFromRequest(request);
	if (!session) return apiError("No autenticado", 401);

	const { id: leagueId } = await params;

	const league = await db.query.leagues.findFirst({
		where: eq(leagues.id, leagueId),
		columns: { id: true, organizationId: true },
	});
	if (!league) return apiError("Liga no encontrada", 404);
	if (!canManageLeague(session, league.organizationId)) {
		return apiError("Sin permiso", 403);
	}

	// Encontrar el playoff matchday (sentinel)
	const playoffMatchday = await db.query.matchdays.findFirst({
		where: and(eq(matchdays.leagueId, leagueId), eq(matchdays.phase, "playoff")),
		columns: { id: true },
	});
	if (!playoffMatchday) return apiError("No existe jornada de fase final", 404);

	// Obtener todos los matchIds vinculados a playoff slots de esta liga
	const brackets = await db.query.playoffBrackets.findMany({
		where: eq(playoffBrackets.leagueId, leagueId),
		columns: { id: true },
	});
	if (brackets.length === 0) return apiSuccess({ fixed: 0 });

	const bracketIds = brackets.map((b) => b.id);
	const slots = await db.query.playoffSlots.findMany({
		where: inArray(playoffSlots.bracketId, bracketIds),
		columns: { matchId: true },
	});

	const matchIds = slots.map((s) => s.matchId).filter((id): id is string => id !== null);

	if (matchIds.length === 0) return apiSuccess({ fixed: 0 });

	// Actualizar solo los partidos que NO estén ya en el playoff matchday
	const wrongMatches = await db.query.matches.findMany({
		where: and(
			inArray(matches.id, matchIds),
			// Excluir los que ya tienen el matchdayId correcto
		),
		columns: { id: true, matchdayId: true },
	});

	const toFix = wrongMatches.filter((m) => m.matchdayId !== playoffMatchday.id);
	if (toFix.length === 0) return apiSuccess({ fixed: 0 });

	const toFixIds = toFix.map((m) => m.id);
	await db
		.update(matches)
		.set({ matchdayId: playoffMatchday.id })
		.where(inArray(matches.id, toFixIds));

	return apiSuccess({ fixed: toFix.length });
}
