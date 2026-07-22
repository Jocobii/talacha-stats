import { describe, expect, it } from "vitest";
import { classifyHost } from "./host";

const ROOT = "talachastats.com";

describe("classifyHost — apex", () => {
	it("clasifica el dominio raíz como apex, root confirmado", () => {
		expect(classifyHost("talachastats.com", ROOT)).toEqual({
			kind: "apex",
			root: "talachastats.com",
			isRootHost: true,
		});
	});

	it("clasifica www como apex, root confirmado", () => {
		expect(classifyHost("www.talachastats.com", ROOT)).toEqual({
			kind: "apex",
			root: "talachastats.com",
			isRootHost: true,
		});
	});

	it("normaliza mayúsculas y puerto antes de clasificar", () => {
		expect(classifyHost("WWW.TalachaStats.com:443", ROOT)).toEqual({
			kind: "apex",
			root: "talachastats.com",
			isRootHost: true,
		});
	});

	it("host vacío o nulo cae a apex sin root confirmado", () => {
		expect(classifyHost(null, ROOT)).toEqual({ kind: "apex", root: "talachastats.com", isRootHost: false });
		expect(classifyHost("", ROOT)).toEqual({ kind: "apex", root: "talachastats.com", isRootHost: false });
	});

	it("localhost a secas (sin subdominio) es apex de su PROPIA familia localhost, root confirmado", () => {
		// Bug real: si esto clasificara con root=ROOT ("talachastats.com") en
		// vez de "localhost", un redirect en proxy.ts mandaría un dev local a
		// producción. `isRootHost: true` aquí habilita ese redirect con
		// seguridad porque `root` ya es "localhost", no el rootDomain configurado.
		expect(classifyHost("localhost:3000", ROOT)).toEqual({
			kind: "apex",
			root: "localhost",
			isRootHost: true,
		});
	});

	it("un dominio de preview de Vercel (*.vercel.app) es apex SIN root confirmado", () => {
		// isRootHost: false → proxy.ts no debe redirigir a `root` desde aquí,
		// solo servir la página tal cual (el preview no tiene wildcard propio).
		expect(classifyHost("talacha-stats-git-main.vercel.app", ROOT)).toEqual({
			kind: "apex",
			root: "talachastats.com",
			isRootHost: false,
		});
	});
});

describe("classifyHost — reservado", () => {
	it("app. es reservado (futuro panel, §9.1)", () => {
		expect(classifyHost("app.talachastats.com", ROOT)).toEqual({
			kind: "reserved",
			sub: "app",
			root: "talachastats.com",
		});
	});

	it("api. y cdn. son reservados", () => {
		expect(classifyHost("api.talachastats.com", ROOT)).toEqual({
			kind: "reserved",
			sub: "api",
			root: "talachastats.com",
		});
		expect(classifyHost("cdn.talachastats.com", ROOT)).toEqual({
			kind: "reserved",
			sub: "cdn",
			root: "talachastats.com",
		});
	});

	it("reutiliza RESERVED_ORG_SLUGS: una ruta pública reservada tampoco es una org", () => {
		expect(classifyHost("ranking.talachastats.com", ROOT)).toEqual({
			kind: "reserved",
			sub: "ranking",
			root: "talachastats.com",
		});
	});

	it("app.localhost es reservado en dev, con root de la familia localhost", () => {
		expect(classifyHost("app.localhost:3000", ROOT)).toEqual({
			kind: "reserved",
			sub: "app",
			root: "localhost",
		});
	});
});

describe("classifyHost — org", () => {
	it("un slug no reservado es el subdominio de una org", () => {
		expect(classifyHost("miliga.talachastats.com", ROOT)).toEqual({
			kind: "org",
			slug: "miliga",
			root: "talachastats.com",
		});
	});

	it("funciona en dev con *.localhost, root de la familia localhost (no el rootDomain configurado)", () => {
		expect(classifyHost("miliga.localhost:3000", ROOT)).toEqual({
			kind: "org",
			slug: "miliga",
			root: "localhost",
		});
	});

	it("funciona en dev con *.lvh.me, root de la familia lvh.me", () => {
		expect(classifyHost("miliga.lvh.me:3000", ROOT)).toEqual({
			kind: "org",
			slug: "miliga",
			root: "lvh.me",
		});
	});

	it("normaliza a minúsculas el slug del subdominio", () => {
		expect(classifyHost("MiLiga.talachastats.com", ROOT)).toEqual({
			kind: "org",
			slug: "miliga",
			root: "talachastats.com",
		});
	});
});
