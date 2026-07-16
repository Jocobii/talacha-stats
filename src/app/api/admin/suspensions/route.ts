/**
 * GET /api/admin/suspensions — B7b, vista global (todas las ligas visibles
 * para el usuario): owner ve todas, organizer solo las de su organización.
 * Pensado para el flujo "domingo en la noche, lista de suspendidos de
 * varias ligas" sin tener que entrar liga por liga.
 */

import { apiSuccess, apiError } from "@/types";
import { getSessionUserFromRequest } from "@/shared/lib/auth";
import {
	listLeaguesForScope,
	listSuspensionsForScope,
	scopeForUser,
} from "@/features/discipline/manage-suspensions";

export async function GET(request: Request) {
	const session = await getSessionUserFromRequest(request);
	if (!session) return apiError("No autenticado", 401);

	const scope = scopeForUser(session);
	if (!scope) return apiSuccess({ suspensions: [], leagues: [] });

	const [suspensions, leagues] = await Promise.all([
		listSuspensionsForScope(scope),
		listLeaguesForScope(scope),
	]);
	return apiSuccess({ suspensions, leagues });
}
