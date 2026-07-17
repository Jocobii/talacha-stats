/**
 * GET /api/players/[id]/credentials
 *
 * Pases del jugador agrupados por organización — sección de credenciales
 * del perfil admin (pantalla D, docs/CREDENCIAL-PASE-JUGADOR.md). `[id]` es
 * el global_player_id (mismo convenio que /api/players/[id]/member).
 *
 * Data siloing: un pase pertenece a una organización. `owner` ve los pases
 * de todas las orgs del jugador (puede tener varios); `organizer` solo ve
 * los de su propia organización — mismo criterio que internal_notes en
 * league_members (AGENTS.md §14).
 */

import { apiError, apiSuccess } from "@/types";
import { getSessionUserFromRequest } from "@/shared/lib/auth";
import type { PlayerCredentialsListResponse } from "@/entities/player-credential/model";
import { listCredentialsForPlayer } from "@/entities/player-credential/queries";
import { db } from "@/db";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
	const session = await getSessionUserFromRequest(request);
	if (!session) return apiError("No autenticado", 401);

	const { id: globalPlayerId } = await params;

	const credentials = await listCredentialsForPlayer(db, globalPlayerId);

	const visible =
		session.role === "owner"
			? credentials
			: credentials.filter((c) => c.organizationId === session.organizationId);

	return apiSuccess<PlayerCredentialsListResponse>(visible);
}
