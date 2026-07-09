/**
 * GET /api/auth/session-expired
 *
 * Limpia la cookie ts_session (inválida: HMAC de un secret viejo, o el
 * usuario ya no existe en DB) y redirige a /login. Ver `redirectToLogin`
 * en shared/lib/auth.ts para el porqué: un `redirect("/login")` directo
 * desde un Server Component deja la cookie viva, y el middleware la
 * detecta y rebota /login → /admin en loop infinito.
 */
import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookie } from "@/shared/lib/session";

export async function GET(request: NextRequest) {
	const from = request.nextUrl.searchParams.get("from");
	const loginUrl = new URL("/login", request.url);
	if (from) loginUrl.searchParams.set("from", from);

	const isProduction = process.env.NODE_ENV === "production";
	const response = NextResponse.redirect(loginUrl);
	response.headers.set("Set-Cookie", clearSessionCookie(isProduction));
	return response;
}
