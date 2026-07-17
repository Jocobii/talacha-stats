/**
 * GET /api/leagues/[id]/credentials
 *
 * Estado de credencial por league_member de la liga — badge por fila del
 * roster (pantalla C, docs/CREDENCIAL-PASE-JUGADOR.md). Endpoint de
 * propósito específico: solo el estado, no los datos del jugador (nombre,
 * dorsal, equipo) que ya sirve el endpoint de roster de team-management.
 */

import { db, leagues } from "@/db";
import { eq } from "drizzle-orm";
import { apiError, apiSuccess } from "@/types";
import { getSessionUserFromRequest, canManageLeague } from "@/shared/lib/auth";
import type { LeagueCredentialStatusesResponse } from "@/entities/player-credential/model";
import { listCredentialStatusesForLeague } from "@/entities/player-credential/queries";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
	const session = await getSessionUserFromRequest(request);
	if (!session) return apiError("No autenticado", 401);

	const { id: leagueId } = await params;

	const league = await db.query.leagues.findFirst({
		where: eq(leagues.id, leagueId),
		columns: { organizationId: true },
	});
	if (!league) return apiError("Liga no encontrada", 404);
	if (!canManageLeague(session, league.organizationId ?? null)) {
		return apiError("Sin permiso para ver esta liga", 403);
	}

	const statuses = await listCredentialStatusesForLeague(db, leagueId);
	return apiSuccess<LeagueCredentialStatusesResponse>(statuses);
}
