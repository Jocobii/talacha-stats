/**
 * POST /api/auth/logout
 * Limpia la cookie de sesión ts_session.
 */
import { clearSessionCookie } from "@/shared/lib/session";

export async function POST() {
	const isProduction = process.env.NODE_ENV === "production";
	return new Response(JSON.stringify({ ok: true }), {
		status: 200,
		headers: {
			"Content-Type": "application/json",
			"Set-Cookie": clearSessionCookie(isProduction),
		},
	});
}
