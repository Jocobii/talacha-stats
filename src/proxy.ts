import { NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "@/shared/i18n/routing";
import { classifyHost, getRootDomain } from "@/shared/tenant/host";

const SESSION_COOKIE = "ts_session";

// "/cedula" = hojas imprimibles (docs/PLAN-CEDULA-IMPRESA.md) — viven en
// app/(print), fuera de [locale] (español-only, igual que /admin), y
// requieren sesión igual que el resto del panel. Sin este prefijo, next-intl
// las trataba como superficie pública e intentaba reescribirlas a
// /[locale]/cedula/... (que no existe) → 404 antes de llegar a la página.
const PROTECTED_PREFIXES = ["/admin", "/onboarding", "/cedula"];
const AUTH_PAGES = ["/login", "/register", "/verify-email"];

// next-intl: negociación de locale + rewrite al segmento [locale] (docs/I18N-PLAN.md §5).
const handleI18nRouting = createMiddleware(routing);

function isProtectedRoute(pathname: string): boolean {
	return PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function isAuthPage(pathname: string): boolean {
	return AUTH_PAGES.some((page) => pathname.startsWith(page));
}

// Guard de sesión — SIN cambios de comportamiento respecto al original.
// El admin y las páginas de auth nunca pasan por la negociación de locale:
// son español-only (AGENTS.md §7.2, plan §0).
function guardSession(request: NextRequest): NextResponse {
	const { pathname } = request.nextUrl;
	const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);

	if (isProtectedRoute(pathname) && !hasSession) {
		const loginUrl = new URL("/login", request.url);
		loginUrl.searchParams.set("from", pathname);
		return NextResponse.redirect(loginUrl);
	}

	if (isAuthPage(pathname) && hasSession) {
		return NextResponse.redirect(new URL("/admin", request.url));
	}

	return NextResponse.next();
}

// docs/SUBDOMINIOS-MULTITENANT.md §5: la URL canónica de una org es su
// subdominio. `/org/{slug}` en el apex es solo un alias legacy que redirige.
const ORG_PATH_PREFIX = /^\/org\/([^/]+)(\/.*)?$/;

function redirectOrgPathToSubdomain(request: NextRequest, slug: string, rest: string): NextResponse {
	const target = new URL(`${rest || "/"}${request.nextUrl.search}`, `https://${slug}.${getRootDomain()}`);
	return NextResponse.redirect(target, 301);
}

export function proxy(request: NextRequest) {
	const { pathname } = request.nextUrl;
	const ctx = classifyHost(request.headers.get("host"));

	// Host de org (miliga.talachastats.com, §2.2): el subdominio es un mundo
	// PÚBLICO. El panel/auth nunca vive aquí — se manda al apex para no
	// fragmentar la sesión (la cookie ts_session es host-only, §8).
	if (ctx.kind === "org") {
		if (isProtectedRoute(pathname) || isAuthPage(pathname)) {
			return NextResponse.redirect(new URL(pathname, `https://${getRootDomain()}`));
		}
		const rewritten = request.nextUrl.clone();
		rewritten.pathname = `/org/${ctx.slug}${pathname === "/" ? "" : pathname}`;
		const rewrittenRequest = new NextRequest(rewritten, request);
		return handleI18nRouting(rewrittenRequest);
	}

	// Subdominio reservado que aún no usamos (api., cdn., etc.) — passthrough.
	// `app.` se reserva para el panel a futuro (§9.1) pero hoy se comporta
	// como apex: cae al bloque de abajo sin `return` anticipado.
	if (ctx.kind === "reserved" && ctx.sub !== "app") {
		return NextResponse.next();
	}

	// Apex / `app.`: alias legacy `/org/{slug}` → 301 a su subdominio (§5).
	const orgAlias = pathname.match(ORG_PATH_PREFIX);
	if (orgAlias) {
		return redirectOrgPathToSubdomain(request, orgAlias[1], orgAlias[2] ?? "");
	}

	// Rutas protegidas/auth: se componen ANTES del i18n, nunca junto a él.
	if (isProtectedRoute(pathname) || isAuthPage(pathname)) {
		return guardSession(request);
	}

	// Todo lo demás (superficie pública): negociación de locale de next-intl.
	// `as-needed` no redirige `/ligas` → `/es/ligas` (verificar con curl -I).
	return handleI18nRouting(request);
}

export const config = {
	// Patrón recomendado por next-intl: todo excepto /api, /_next, /_vercel y
	// archivos con punto (assets estáticos). Cubre también /admin, /onboarding
	// y las páginas de auth — `proxy()` las desvía a `guardSession` arriba,
	// nunca llegan a `handleI18nRouting`.
	matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
