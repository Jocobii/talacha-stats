import { describe, expect, it } from "vitest";
import { classifyHost } from "./host";

const ROOT = "talachastats.com";

describe("classifyHost — apex", () => {
	it("clasifica el dominio raíz como apex", () => {
		expect(classifyHost("talachastats.com", ROOT)).toEqual({ kind: "apex" });
	});

	it("clasifica www como apex", () => {
		expect(classifyHost("www.talachastats.com", ROOT)).toEqual({ kind: "apex" });
	});

	it("normaliza mayúsculas y puerto antes de clasificar", () => {
		expect(classifyHost("WWW.TalachaStats.com:443", ROOT)).toEqual({ kind: "apex" });
	});

	it("host vacío o nulo cae a apex", () => {
		expect(classifyHost(null, ROOT)).toEqual({ kind: "apex" });
		expect(classifyHost("", ROOT)).toEqual({ kind: "apex" });
	});

	it("localhost a secas (sin subdominio) es apex", () => {
		expect(classifyHost("localhost:3000", ROOT)).toEqual({ kind: "apex" });
	});

	it("un dominio de preview de Vercel (*.vercel.app) es apex por defecto", () => {
		expect(classifyHost("talacha-stats-git-main.vercel.app", ROOT)).toEqual({ kind: "apex" });
	});
});

describe("classifyHost — reservado", () => {
	it("app. es reservado (futuro panel, §9.1)", () => {
		expect(classifyHost("app.talachastats.com", ROOT)).toEqual({ kind: "reserved", sub: "app" });
	});

	it("api. y cdn. son reservados", () => {
		expect(classifyHost("api.talachastats.com", ROOT)).toEqual({ kind: "reserved", sub: "api" });
		expect(classifyHost("cdn.talachastats.com", ROOT)).toEqual({ kind: "reserved", sub: "cdn" });
	});

	it("reutiliza RESERVED_ORG_SLUGS: una ruta pública reservada tampoco es una org", () => {
		expect(classifyHost("ranking.talachastats.com", ROOT)).toEqual({ kind: "reserved", sub: "ranking" });
	});

	it("app.localhost es reservado en dev", () => {
		expect(classifyHost("app.localhost:3000", ROOT)).toEqual({ kind: "reserved", sub: "app" });
	});
});

describe("classifyHost — org", () => {
	it("un slug no reservado es el subdominio de una org", () => {
		expect(classifyHost("miliga.talachastats.com", ROOT)).toEqual({ kind: "org", slug: "miliga" });
	});

	it("funciona en dev con *.localhost", () => {
		expect(classifyHost("miliga.localhost:3000", ROOT)).toEqual({ kind: "org", slug: "miliga" });
	});

	it("funciona en dev con *.lvh.me", () => {
		expect(classifyHost("miliga.lvh.me:3000", ROOT)).toEqual({ kind: "org", slug: "miliga" });
	});

	it("normaliza a minúsculas el slug del subdominio", () => {
		expect(classifyHost("MiLiga.talachastats.com", ROOT)).toEqual({ kind: "org", slug: "miliga" });
	});
});
