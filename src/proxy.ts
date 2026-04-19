import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
	const { pathname } = request.nextUrl;

	// Solo proteger rutas /admin
	if (!pathname.startsWith("/admin")) {
		return NextResponse.next();
	}

	const session = request.cookies.get("admin_session");
	const validToken = process.env.ADMIN_SESSION_TOKEN;

	// Si la cookie es válida, dejar pasar
	if (validToken && session?.value === validToken) {
		return NextResponse.next();
	}

	// Si no, redirigir al login guardando el destino
	const loginUrl = new URL("/login", request.url);
	loginUrl.searchParams.set("from", pathname);
	return NextResponse.redirect(loginUrl);
}

export const config = {
	matcher: ["/admin/:path*"],
};
