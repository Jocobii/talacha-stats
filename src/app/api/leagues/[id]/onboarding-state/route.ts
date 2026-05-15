/**
 * GET /api/leagues/[id]/onboarding-state
 *
 * Devuelve el estado de onboarding de una liga para que la UI decida
 * si mostrar el wizard o redirigir al detalle.
 */

import { apiSuccess, apiError } from "@/types";
import { getSessionUserFromRequest } from "@/shared/lib/auth";
import { getLeagueOnboardingState } from "@/features/league-onboarding/queries";
import { db, leagues } from "@/db";
import { eq } from "drizzle-orm";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
	const session = await getSessionUserFromRequest(request);
	if (!session) return apiError("No autenticado", 401);

	const { id } = await params;

	// Verificar que la liga existe y el usuario tiene acceso
	const league = await db.query.leagues.findFirst({
		where: eq(leagues.id, id),
		columns: { id: true, organizationId: true },
	});
	if (!league) return apiError("Liga no encontrada", 404);

	if (session.role === "organizer" && session.organizationId !== league.organizationId) {
		return apiError("Sin permiso", 403);
	}

	const state = await getLeagueOnboardingState(id);
	return apiSuccess(state);
}
