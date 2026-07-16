/**
 * GET /api/admin/suspensions/players?q=texto
 *
 * Búsqueda de jugador por nombre para "Registrar sanción" en modo global
 * (B7b) — paso 1 del flujo invertido: primero se busca al jugador
 * (org/owner-wide, según el rol de la sesión), luego se elige entre las
 * ligas donde juega. Requiere `q` de al menos 2 letras (igual que
 * /api/players/org-search) — sin texto no responde nada, evita mandar un
 * "primeros 10" arbitrario sobre toda la base de jugadores.
 */

import { apiSuccess, apiError } from "@/types";
import { getSessionUserFromRequest } from "@/shared/lib/auth";
import { scopeForUser, searchPlayersForScope } from "@/features/discipline/manage-suspensions";

export async function GET(request: Request) {
	const session = await getSessionUserFromRequest(request);
	if (!session) return apiError("No autenticado", 401);

	const scope = scopeForUser(session);
	if (!scope) return apiSuccess([]);

	const { searchParams } = new URL(request.url);
	const q = searchParams.get("q")?.trim() ?? "";
	if (q.length < 2) return apiSuccess([]);

	const results = await searchPlayersForScope(scope, { q, limit: 10 });
	return apiSuccess(results);
}
