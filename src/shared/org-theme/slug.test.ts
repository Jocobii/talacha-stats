import { describe, expect, it } from "vitest";
import { ORG_SLUG_REGEX, suggestOrgSlug, validateOrgSlug } from "./slug";

describe("validateOrgSlug", () => {
	it("acepta slugs válidos", () => {
		for (const slug of ["novofut", "casablanca-fc", "liga-2026", "abc"]) {
			expect(validateOrgSlug(slug)).toEqual({ ok: true });
		}
	});

	it("rechaza formato inválido", () => {
		const casos = [
			"ab", // muy corto
			"a".repeat(41), // muy largo
			"Novofut", // mayúsculas
			"novo_fut", // underscore
			"novo fut", // espacio
			"-novofut", // guion inicial
			"novofut-", // guion final
			"novo--fut", // guion doble
			"ligá", // acento
			"novo.fut", // punto (rompería DNS)
		];
		for (const slug of casos) {
			const r = validateOrgSlug(slug);
			expect(r.ok, `"${slug}" debería ser inválido`).toBe(false);
			if (!r.ok) expect(r.reason).toBe("formato");
		}
	});

	it("rechaza slugs reservados (futuro subdominio)", () => {
		for (const slug of ["www", "admin", "api", "ranking", "talachastats"]) {
			const r = validateOrgSlug(slug);
			expect(r.ok).toBe(false);
			if (!r.ok) expect(r.reason).toBe("reservado");
		}
	});
});

describe("suggestOrgSlug", () => {
	it("normaliza nombres reales de organizaciones", () => {
		expect(suggestOrgSlug("Novofut")).toBe("novofut");
		expect(suggestOrgSlug("Casablanca FC")).toBe("casablanca-fc");
		expect(suggestOrgSlug("Liga Muñoz")).toBe("liga-munoz");
		expect(suggestOrgSlug("  Furati 2026!!  ")).toBe("furati-2026");
	});

	it("las sugerencias pasan la validación de formato", () => {
		for (const name of ["Novofut", "Casablanca FC", "Liga Muñoz", "El Cañón de Tijuana"]) {
			const slug = suggestOrgSlug(name);
			expect(ORG_SLUG_REGEX.test(slug), `"${slug}" no pasa el regex`).toBe(true);
		}
	});
});
