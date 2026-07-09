/**
 * GET /api/auth/verification-status?email=xxx
 * Usado por el wizard de /register para hacer polling y detectar, sin
 * recargar la página, cuando el usuario hizo clic en el enlace de su correo
 * (ese clic ocurre en otra pestaña/dispositivo vía GET /api/auth/verify-email).
 * No expone más que un booleano — no hay dato sensible en la respuesta.
 */
import { apiError, apiSuccess } from "@/types";
import { getUserByEmail } from "@/entities/user";

export async function GET(request: Request) {
	const email = new URL(request.url).searchParams.get("email");
	if (!email) return apiError("Falta email", 400);

	const user = await getUserByEmail(email);
	if (!user) return apiError("No encontramos una cuenta con ese correo", 404);

	return apiSuccess({ verified: user.emailVerified });
}
