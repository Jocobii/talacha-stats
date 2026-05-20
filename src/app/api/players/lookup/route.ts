/**
 * GET /api/players/lookup?curp=CURP_DEL_JUGADOR
 *
 * Busca un jugador global por CURP.
 * Llamado desde el RegistrationForm cada vez que el oficinista termina
 * de escribir la CURP (debounced, 400ms).
 *
 * Responses:
 *   200 { ok: true, data: { found: true,  player: { id, fullName, birthDate, avatarUrl, createdAt } } }
 *   200 { ok: true, data: { found: false } }
 *   400 { ok: false, error: "CURP inválida…" }
 *   500 { ok: false, error: "Error al consultar la base de datos" }
 *
 * El curpHash NUNCA sale en la respuesta — se omite en lookupByCurp.
 */

import { apiSuccess, apiError } from "@/types";
import { lookupByCurp } from "@/features/admin-registration";

export async function GET(request: Request): Promise<Response> {
	const { searchParams } = new URL(request.url);
	const curp = searchParams.get("curp")?.trim() ?? "";

	if (!curp) return apiError("El parámetro 'curp' es requerido", 400);

	const result = await lookupByCurp({ curp });

	if (!result.ok) {
		const status = result.code === "INVALID_CURP" ? 400 : 500;
		return apiError(result.error, status);
	}

	return apiSuccess(result.data);
}
