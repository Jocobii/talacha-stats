/**
 * POST /api/auth/login
 * Body: { email, password }
 * Autentica al usuario y setea la cookie de sesion ts_session.
 */
import { apiError } from "@/types";
import { LoginSchema } from "@/entities/user";
import { getUserByEmail, verifyPassword } from "@/entities/user";
import { buildSessionCookie } from "@/shared/lib/session";
import { buildCityCookieHeader, ACTIVE_CITY_COOKIE } from "@/shared/lib/active-city";
import { DEFAULT_CITY } from "@/shared/lib/cities";

export async function POST(request: Request) {
	const body = await request.json().catch(() => ({}));
	const parsed = LoginSchema.safeParse(body);
	if (!parsed.success) return apiError("Email y contrasena requeridos", 400);

	const { email, password } = parsed.data;

	const user = await getUserByEmail(email);
	if (!user || !user.active) {
		return apiError("Credenciales incorrectas", 401);
	}

	const valid = await verifyPassword(password, user.passwordHash);
	if (!valid) return apiError("Credenciales incorrectas", 401);

	// Bloquear acceso si el email no ha sido verificado
	if (!user.emailVerified) {
		return apiError(
			"Debes verificar tu correo antes de iniciar sesion. Revisa tu bandeja de entrada.",
			403,
		);
	}

	const isProduction = process.env.NODE_ENV === "production";
	const sessionCookie = buildSessionCookie(user.id, isProduction);

	// Solo setear ciudad si no existe cookie previa
	const existingCity = request.headers
		.get("cookie")
		?.match(new RegExp(`${ACTIVE_CITY_COOKIE}=([^;]+)`))?.[1];

	const setCookies = [sessionCookie];
	if (!existingCity) setCookies.push(buildCityCookieHeader(DEFAULT_CITY, isProduction));

	const from = (body as { from?: string }).from;
	const redirectTo = from?.startsWith("/admin") ? from : "/admin";

	return new Response(
		JSON.stringify({
			ok: true,
			redirect: redirectTo,
			user: { name: user.name, role: user.role },
		}),
		{
			status: 200,
			headers: {
				"Content-Type": "application/json",
				"Set-Cookie": setCookies.join(", "),
			},
		},
	);
}
