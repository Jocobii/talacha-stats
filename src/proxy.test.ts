import { NextRequest, NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Aislamos la unidad: el negocio de proxy.ts es la composición guard+i18n,
// no la negociación de locale en sí (eso ya lo prueba next-intl, AGENTS §20.3).
const handleI18nRoutingMock = vi.fn((_request: NextRequest) => NextResponse.next());

vi.mock("next-intl/middleware", () => ({
	default: () => handleI18nRoutingMock,
}));

const { config, proxy } = await import("./proxy");

// Los tests nuevos (subdominio de org) aseveran sobre el número de llamadas
// y sus argumentos exactos — sin este reset, las llamadas de tests previos
// se acumulan en el mismo mock y contaminan esas aserciones.
beforeEach(() => {
	handleI18nRoutingMock.mockClear();
});

function buildRequest(pathname: string, options?: { session?: boolean; host?: string }) {
	const host = options?.host ?? "talachastats.test";
	const request = new NextRequest(`https://${host}${pathname}`, { headers: { host } });
	if (options?.session) request.cookies.set("ts_session", "token");
	return request;
}

describe("proxy — guard de sesión (sin cambios de comportamiento)", () => {
	it("redirige /admin/* a /login cuando no hay sesión", () => {
		const response = proxy(buildRequest("/admin/ligas"));
		expect(response.status).toBe(307);
		expect(response.headers.get("location")).toContain("/login?from=%2Fadmin%2Fligas");
		expect(handleI18nRoutingMock).not.toHaveBeenCalled();
	});

	it("deja pasar /admin/* con sesión, sin negociación de locale", () => {
		const response = proxy(buildRequest("/admin/ligas", { session: true }));
		expect(response.status).toBe(200);
		expect(handleI18nRoutingMock).not.toHaveBeenCalled();
	});

	it("redirige /login a /admin cuando ya hay sesión", () => {
		const response = proxy(buildRequest("/login", { session: true }));
		expect(response.status).toBe(307);
		expect(response.headers.get("location")).toContain("/admin");
	});

	it("deja pasar /login sin sesión, sin negociación de locale", () => {
		const response = proxy(buildRequest("/login"));
		expect(response.status).toBe(200);
		expect(handleI18nRoutingMock).not.toHaveBeenCalled();
	});

	it("/onboarding se trata como ruta protegida", () => {
		const response = proxy(buildRequest("/onboarding"));
		expect(response.status).toBe(307);
		expect(response.headers.get("location")).toContain("/login");
	});
});

describe("proxy — superficie pública delega en next-intl", () => {
	it("rutas públicas se delegan al middleware de next-intl", () => {
		const request = buildRequest("/ligas");
		proxy(request);
		expect(handleI18nRoutingMock).toHaveBeenCalledWith(request);
	});

	it("la raíz también se delega (negociación de locale en /)", () => {
		const request = buildRequest("/");
		proxy(request);
		expect(handleI18nRoutingMock).toHaveBeenCalledWith(request);
	});
});

describe("proxy — subdominio de org (docs/SUBDOMINIOS-MULTITENANT.md §2.2)", () => {
	it("reescribe /ranking en miliga.talachastats.com a /org/miliga/ranking y delega en next-intl", () => {
		const request = buildRequest("/ranking", { host: "miliga.talachastats.com" });
		proxy(request);
		expect(handleI18nRoutingMock).toHaveBeenCalledTimes(1);
		const rewritten = handleI18nRoutingMock.mock.calls[0][0] as unknown as NextRequest;
		expect(rewritten.nextUrl.pathname).toBe("/org/miliga/ranking");
	});

	it("reescribe la raíz del subdominio a /org/{slug} (sin '/' colgante)", () => {
		const request = buildRequest("/", { host: "miliga.talachastats.com" });
		proxy(request);
		const rewritten = handleI18nRoutingMock.mock.calls[0][0] as unknown as NextRequest;
		expect(rewritten.nextUrl.pathname).toBe("/org/miliga");
	});

	it("manda /admin/* en un subdominio de org al apex (nunca panel en subdominio)", () => {
		const response = proxy(buildRequest("/admin/ligas", { host: "miliga.talachastats.com" }));
		expect(response.status).toBe(307);
		expect(response.headers.get("location")).toContain("talachastats.com/admin/ligas");
		expect(handleI18nRoutingMock).not.toHaveBeenCalled();
	});

	it("manda /login en un subdominio de org al apex", () => {
		const response = proxy(buildRequest("/login", { host: "miliga.talachastats.com" }));
		expect(response.status).toBe(307);
		expect(response.headers.get("location")).toContain("talachastats.com/login");
		expect(handleI18nRoutingMock).not.toHaveBeenCalled();
	});
});

describe("proxy — /org/{slug} en el apex redirige 301 al subdominio (§5)", () => {
	it("redirige /org/miliga a https://miliga.talachastats.com/", () => {
		const response = proxy(buildRequest("/org/miliga", { host: "talachastats.com" }));
		expect(response.status).toBe(301);
		expect(response.headers.get("location")).toBe("https://miliga.talachastats.com/");
		expect(handleI18nRoutingMock).not.toHaveBeenCalled();
	});

	it("preserva subruta y query string", () => {
		const response = proxy(
			buildRequest("/org/miliga/liga-1?foo=bar", { host: "talachastats.com" }),
		);
		expect(response.status).toBe(301);
		expect(response.headers.get("location")).toBe("https://miliga.talachastats.com/liga-1?foo=bar");
	});

	it("regresión: en localhost redirige dentro de la familia localhost, NUNCA a producción", () => {
		// Bug real observado en dev: sin NEXT_PUBLIC_ROOT_DOMAIN configurado,
		// esto mandaba a https://miliga.talachastats.com (producción real).
		const response = proxy(buildRequest("/org/miliga", { host: "localhost:3000" }));
		// 307, no 301: un 301 en dev queda cacheado PERMANENTEMENTE en el
		// navegador — el síntoma real que reportó Jocobi (seguía redirigiendo
		// a la URL vieja tras arreglar el código y poner el env var, porque el
		// navegador nunca volvía a pedirle nada al server).
		expect(response.status).toBe(307);
		expect(response.headers.get("location")).toBe("https://miliga.localhost:3000/");
	});

	it("un host desconocido (preview *.vercel.app) NO redirige — sirve /org/{slug} tal cual", () => {
		const request = buildRequest("/org/miliga", { host: "talacha-stats-git-main.vercel.app" });
		const response = proxy(request);
		expect(response.status).toBe(200);
		expect(handleI18nRoutingMock).toHaveBeenCalledWith(request);
	});
});

describe("proxy — subdominios reservados", () => {
	it("app.talachastats.com se comporta como apex (panel reservado a futuro, §9.1)", () => {
		const response = proxy(buildRequest("/admin/ligas", { host: "app.talachastats.com" }));
		expect(response.status).toBe(307);
		expect(response.headers.get("location")).toContain("/login");
	});

	it("un reservado que no es 'app' hace passthrough sin negociación de locale", () => {
		const response = proxy(buildRequest("/", { host: "api.talachastats.com" }));
		expect(response.status).toBe(200);
		expect(handleI18nRoutingMock).not.toHaveBeenCalled();
	});
});

describe("config.matcher", () => {
	it("excluye /api, /_next, /_vercel y archivos con punto", () => {
		expect(config.matcher).toEqual(["/((?!api|_next|_vercel|.*\\..*).*)"]);
	});
});
