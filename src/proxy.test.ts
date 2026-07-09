import { NextRequest, NextResponse } from "next/server";
import { describe, expect, it, vi } from "vitest";

// Aislamos la unidad: el negocio de proxy.ts es la composición guard+i18n,
// no la negociación de locale en sí (eso ya lo prueba next-intl, AGENTS §20.3).
const handleI18nRoutingMock = vi.fn(() => NextResponse.next());

vi.mock("next-intl/middleware", () => ({
	default: () => handleI18nRoutingMock,
}));

const { config, proxy } = await import("./proxy");

function buildRequest(pathname: string, options?: { session?: boolean }) {
	const request = new NextRequest(`https://talachastats.test${pathname}`);
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

describe("config.matcher", () => {
	it("excluye /api, /_next, /_vercel y archivos con punto", () => {
		expect(config.matcher).toEqual(["/((?!api|_next|_vercel|.*\\..*).*)"]);
	});
});
