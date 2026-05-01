/**
 * GET /api/auth/me
 * Retorna el usuario de la sesión activa o 401.
 */
import { apiSuccess, apiError } from "@/types";
import { getSessionUserFromRequest } from "@/shared/lib/auth";

export async function GET(request: Request) {
	const user = await getSessionUserFromRequest(request);
	if (!user) return apiError("No autenticado", 401);
	return apiSuccess(user);
}
