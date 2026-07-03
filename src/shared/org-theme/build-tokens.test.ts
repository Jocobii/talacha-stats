import { describe, expect, it } from "vitest";
import { buildThemeTokens, reportThemeContrast, type ThemeInput } from "./build-tokens";
import { contrastRatio } from "./contrast";

const AZUL: ThemeInput = {
	primary: "#2563eb",
	accent: "#fbbf24",
	surface: "#0b1220",
	ink: "#eef2f7",
};

describe("buildThemeTokens", () => {
	it("las tintas sobre primary/accent siempre son legibles (AA)", () => {
		const t = buildThemeTokens(AZUL);
		expect(contrastRatio(t.primaryInk, t.primary)).toBeGreaterThanOrEqual(4.5);
		expect(contrastRatio(t.accentInk, t.accent)).toBeGreaterThanOrEqual(4.5);
	});

	it("ink cumple AA sobre surface aunque el input sea ilegible", () => {
		const roto: ThemeInput = { ...AZUL, ink: "#0b1220" }; // ink == surface
		const t = buildThemeTokens(roto);
		expect(contrastRatio(t.ink, t.surface)).toBeGreaterThanOrEqual(4.5);
	});

	it("respeta el ink del usuario cuando ya es legible", () => {
		const t = buildThemeTokens(AZUL);
		expect(t.ink).toBe(AZUL.ink);
	});

	it("inkDim cumple al menos 3:1 (AA large) sobre surface", () => {
		const t = buildThemeTokens(AZUL);
		expect(contrastRatio(t.inkDim, t.surface)).toBeGreaterThanOrEqual(3);
	});

	it("deriva superficies y líneas distintas del surface base", () => {
		const t = buildThemeTokens(AZUL);
		expect(t.surface2).not.toBe(t.surface);
		expect(t.line).not.toBe(t.surface);
	});

	it("tints salen como rgba() del primary", () => {
		const t = buildThemeTokens(AZUL);
		expect(t.tint).toMatch(/^rgba\(37, 99, 235, /);
		expect(t.tintBd).toMatch(/^rgba\(37, 99, 235, /);
	});

	it("es determinista (CSS y Satori deben coincidir siempre)", () => {
		expect(buildThemeTokens(AZUL)).toEqual(buildThemeTokens(AZUL));
	});

	it("funciona igual con temas de fondo claro", () => {
		const claro: ThemeInput = {
			primary: "#166534",
			accent: "#b45309",
			surface: "#f6f5f0",
			ink: "#1c1e1c",
		};
		const t = buildThemeTokens(claro);
		expect(contrastRatio(t.ink, t.surface)).toBeGreaterThanOrEqual(4.5);
		expect(contrastRatio(t.primaryInk, t.primary)).toBeGreaterThanOrEqual(4.5);
		expect(contrastRatio(t.inkDim, t.surface)).toBeGreaterThanOrEqual(3);
	});
});

describe("reportThemeContrast", () => {
	it("reporta ratios y no marca ajuste cuando el tema es sano", () => {
		const r = reportThemeContrast(AZUL);
		expect(r.inkOnSurface).toBeGreaterThanOrEqual(4.5);
		expect(r.inkWasAdjusted).toBe(false);
	});

	it("marca inkWasAdjusted cuando el ink del usuario era ilegible", () => {
		const r = reportThemeContrast({ ...AZUL, ink: "#0b1220" });
		expect(r.inkWasAdjusted).toBe(true);
		expect(r.inkOnSurface).toBeGreaterThanOrEqual(4.5);
	});
});
