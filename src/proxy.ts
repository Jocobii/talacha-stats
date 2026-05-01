import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE = "ts_session";

const PROTECTED_PREFIXES = ["/admin", "/onboarding"];
const AUTH_PAGES = ["/login", "/register", "/verify-email"];

export function proxy(request: NextRequest) {
	const { pathname } = request.nextUrl;

	const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
	const isAuthPage = AUTH_PAGES.some((page) => pathname.startsWith(page));

	const sessionToken = request.cookies.get(SESSION_COOKIE)?.value;
	const hasSession = Boolean(sessionToken);

	// Redirect unauthenticated users away from protected routes
	if (isProtected && !hasSession) {
		const loginUrl = new URL("/login", request.url);
		loginUrl.searchParams.set("from", pathname);
		return NextResponse.redirect(loginUrl);
	}

	// Redirect authenticated users away from auth pages
	if (isAuthPage && hasSession) {
		return NextResponse.redirect(new URL("/admin", request.url));
	}

	return NextResponse.next();
}

export const config = {
	matcher: [
		"/admin/:path*",
		"/onboarding/:path*",
		"/login",
		"/register",
		"/verify-email",
	],
};
