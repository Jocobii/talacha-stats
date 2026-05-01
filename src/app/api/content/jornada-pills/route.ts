/**
 * GET /api/content/jornada-pills?leagueId=uuid&jornada=N
 *
 * Devuelve las píldoras narrativas generadas para una jornada importada.
 * Úsalo desde el panel de importación para mostrar el resumen al organizador
 * justo después de confirmar la importación.
 */

import { apiSuccess, apiError } from "@/types";
import { getSessionUserFromRequest } from "@/shared/lib/auth";
import { generateJornadaPills } from "@/features/post-import-content";

export async function GET(request: Request) {
	const session = await getSessionUserFromRequest(request);
	if (!session) return apiError("No autenticado", 401);

	const { searchParams } = new URL(request.url);
	const leagueId = searchParams.get("leagueId");
	const jornadaRaw = searchParams.get("jornada");

	if (!leagueId) return apiError("Falta leagueId", 400);
	if (!jornadaRaw || isNaN(Number(jornadaRaw))) return apiError("jornada debe ser un número", 400);

	const jornada = Number(jornadaRaw);
	if (jornada < 1) return apiError("jornada debe ser mayor a 0", 400);

	const pills = await generateJornadaPills(leagueId, jornada);
	return apiSuccess(pills);
}
