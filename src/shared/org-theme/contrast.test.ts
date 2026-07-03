import { describe, expect, it } from "vitest";
import {
	INK_DARK,
	INK_LIGHT,
	contrastRatio,
	ensureContrast,
	inkOn,
	relativeLuminance,
} from "./contrast";

describe("relativeLuminance", () => {
	it("negro=0, blanco=1", () => {
		expect(relativeLuminance("#000000")).toBe(0);
		expect(relativeLuminance("#ffffff")).toBeCloseTo(1, 5);
	});
});

describe("contrastRatio", () => {
	it("blanco/negro = 21 (máximo WCAG)", () => {
		expect(contrastRatio("#ffffff", "#000000")).toBeCloseTo(21, 1);
	});

	it("es simétrico", () => {
		expect(contrastRatio("#2563eb", "#ffffff")).toBeCloseTo(
			contrastRatio("#ffffff", "#2563eb"),
			10,
		);
	});

	it("un color contra sí mismo = 1", () => {
		expect(contrastRatio("#2563eb", "#2563eb")).toBe(1);
	});
});

describe("inkOn", () => {
	it("elige tinta oscura sobre fondos claros", () => {
		expect(inkOn("#ffffff")).toBe(INK_DARK);
		expect(inkOn("#fbbf24")).toBe(INK_DARK); // amarillo brillante
	});

	it("elige tinta clara sobre fondos oscuros", () => {
		expect(inkOn("#000000")).toBe(INK_LIGHT);
		expect(inkOn("#1d4ed8")).toBe(INK_LIGHT); // azul profundo
	});

	it("la tinta elegida siempre gana o empata a la alternativa", () => {
		for (const bg of ["#ef4444", "#f97316", "#a78bfa", "#14b8a6", "#808080"]) {
			const chosen = inkOn(bg);
			const other = chosen === INK_LIGHT ? INK_DARK : INK_LIGHT;
			expect(contrastRatio(chosen, bg)).toBeGreaterThanOrEqual(contrastRatio(other, bg));
		}
	});
});

describe("ensureContrast", () => {
	it("devuelve el color intacto si ya cumple", () => {
		expect(ensureContrast("#ffffff", "#000000")).toBe("#ffffff");
	});

	it("ajusta un color ilegible hasta cumplir el mínimo", () => {
		// gris medio sobre blanco: ~2.8:1 — debe oscurecerse
		const fixed = ensureContrast("#999999", "#ffffff");
		expect(contrastRatio(fixed, "#ffffff")).toBeGreaterThanOrEqual(4.5);
	});

	it("aclara sobre fondos oscuros, oscurece sobre claros", () => {
		const onDark = ensureContrast("#333333", "#111111");
		const onLight = ensureContrast("#cccccc", "#f6f5f0");
		expect(relativeLuminance(onDark)).toBeGreaterThan(relativeLuminance("#333333"));
		expect(relativeLuminance(onLight)).toBeLessThan(relativeLuminance("#cccccc"));
	});

	it("es determinista", () => {
		expect(ensureContrast("#999999", "#ffffff")).toBe(ensureContrast("#999999", "#ffffff"));
	});

	it("nunca devuelve algo por debajo del mínimo (fallback inkOn)", () => {
		// caso extremo: mismo color que el fondo
		for (const bg of ["#808080", "#ffffff", "#000000", "#2563eb"]) {
			const fixed = ensureContrast(bg, bg);
			expect(contrastRatio(fixed, bg)).toBeGreaterThanOrEqual(4.5);
		}
	});

	it("respeta un mínimo custom (AA large = 3)", () => {
		const fixed = ensureContrast("#aaaaaa", "#ffffff", 3);
		expect(contrastRatio(fixed, "#ffffff")).toBeGreaterThanOrEqual(3);
	});
});
