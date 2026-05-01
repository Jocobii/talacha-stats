/**
 * GET /api/auth/verify-email?token=xxx
 *
 * Flujo:
 * 1. Leer token del query string
 * 2. Buscar usuario con ese token (y que no haya expirado)
 * 3. Marcar emailVerified = true, limpiar token
 * 4. Crear sesion y redirigir a /onboarding
 *
 * Errores redirigen a /registro con ?error= para mostrar mensaje en UI
 */
import { redirect } from "next/navigation";
import { getUserByVerificationToken, markEmailVerified } from "@/entities/user";
import { buildSessionCookie } from "@/shared/lib/session";

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const token = searchParams.get("token");

	if (!token) {
		redirect("/registro?error=token-invalido");
	}

	// Busca usuario con el token valido (la query ya filtra por expiracion)
	const user = await getUserByVerificationToken(token);

	if (!user) {
		// Token invalido O expirado — Drizzle no distingue, el mensaje es generico
		redirect("/registro?error=token-expirado");
	}

	// Verificar email y limpiar token
	await markEmailVerified(user.id);

	// Crear sesion igual que en login
	const isProduction = process.env.NODE_ENV === "production";
	const sessionCookie = buildSessionCookie(user.id, isProduction);

	// Redirigir a onboarding con la cookie de sesion seteada
	return new Response(null, {
		status: 302,
		headers: {
			Location: "/onboarding",
			"Set-Cookie": sessionCookie,
		},
	});
}
