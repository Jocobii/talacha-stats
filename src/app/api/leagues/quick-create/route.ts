/**
 * POST /api/leagues/quick-create
 *
 * Alta rápida (A2): crea una liga y sus equipos en una sola transacción.
 * Devuelve la liga creada (con slug para el link público) y los equipos.
 *
 * Errores:
 *   409 — ya existe una liga con ese nombre/día/temporada en la organización.
 *   400 — equipos duplicados o sin equipos válidos / validación de payload.
 *   401 — sin sesión.
 */

import { apiSuccess, apiError } from "@/types";
import { getSessionUserFromRequest } from "@/shared/lib/auth";
import {
	QuickCreateLeagueSchema,
	quickCreateLeague,
} from "@/features/league-onboarding/quick-create";

export async function POST(request: Request) {
	const session = await getSessionUserFromRequest(request);
	if (!session) return apiError("No autenticado", 401);

	const body = await request.json().catch(() => null);
	const parsed = QuickCreateLeagueSchema.safeParse(body);
	if (!parsed.success) return apiError(parsed.error.message);

	const result = await quickCreateLeague(parsed.data, {
		role: session.role,
		organizationId: session.organizationId ?? null,
	});

	if (!result.ok) {
		const status = result.code === "LEAGUE_EXISTS" ? 409 : 400;
		return apiError(result.error, status);
	}

	return apiSuccess({ league: result.league });
}
