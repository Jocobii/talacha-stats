/**
 * POST /api/matchdays/[matchdayId]/close
 *
 * Cierra una jornada: valida que todos los partidos están capturados
 * y cambia el status a "completed".
 *
 * Efectos:
 * - La jornada desaparece del sorteo cockpit (que solo muestra draft|published).
 * - Los resultados quedan bloqueados para edición.
 * - Las posiciones se calculan en vivo desde los partidos capturados.
 */
import { apiSuccess, apiError } from "@/types";
import { getSessionUserFromRequest, canManageLeague } from "@/shared/lib/auth";
import { db } from "@/db";
import { matchdays, matches } from "@/db/schema";
import { eq } from "drizzle-orm";

type Params = { params: Promise<{ matchdayId: string }> };

const CAPTURED_STATUSES = new Set([
	"played",
	"walkover_home",
	"walkover_away",
	"suspended",
	"postponed",
	"completed",
]);

export async function POST(request: Request, { params }: Params) {
	const session = await getSessionUserFromRequest(request);
	if (!session) return apiError("No autenticado", 401);

	const { matchdayId } = await params;

	const matchday = await db.query.matchdays.findFirst({
		where: eq(matchdays.id, matchdayId),
		with: { league: { columns: { organizationId: true } } },
		columns: { id: true, status: true, leagueId: true, number: true },
	});
	if (!matchday) return apiError("Jornada no encontrada", 404);
	if (!canManageLeague(session, matchday.league?.organizationId ?? null)) {
		return apiError("Sin permiso", 403);
	}
	if (matchday.status === "completed") {
		return apiError("La jornada ya está cerrada", 409);
	}

	// Verificar que todos los partidos están capturados
	const matchRows = await db.query.matches.findMany({
		where: eq(matches.matchdayId, matchdayId),
		columns: { id: true, status: true },
	});

	if (matchRows.length === 0) {
		return apiError("No hay partidos en esta jornada", 400);
	}

	const uncaptured = matchRows.filter((m) => !CAPTURED_STATUSES.has(m.status));
	if (uncaptured.length > 0) {
		return apiError(
			`Faltan ${uncaptured.length} partido(s) por capturar antes de cerrar la jornada`,
			400,
		);
	}

	// Cerrar la jornada
	await db.update(matchdays).set({ status: "completed" }).where(eq(matchdays.id, matchdayId));

	return apiSuccess({
		matchdayId,
		number: matchday.number,
		leagueId: matchday.leagueId,
	});
}
