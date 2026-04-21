import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE = "ts_session";

export function proxy(request: NextRequest) {
	const { pathname } = request.nextUrl;

	// Solo proteger rutas /admin
	if (!pathname.startsWith("/admin")) {
		return NextResponse.next();
	}

	const sessionCookie = request.cookies.get(SESSION_COOKIE)?.value;

	// Si existe la cookie de sesión, dejar pasar.
	// La validación completa del token + DB ocurre en el layout y los API routes.
	if (sessionCookie) {
		return NextResponse.next();
	}

	// Sin cookie → redirigir al login guardando el destino
	const loginUrl = new URL("/login", request.url);
	loginUrl.searchParams.set("from", pathname);
	return NextResponse.redirect(loginUrl);
}

export const config = {
	matcher: ["/admin/:path*"],
};
