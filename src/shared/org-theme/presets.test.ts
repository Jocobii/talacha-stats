/**
 * Guardia de curaduría: TODA paleta del catálogo debe producir un tema
 * legible. Agregar un preset ilegible rompe CI, no producción.
 */
import { describe, expect, it } from "vitest";
import { buildThemeTokens } from "./build-tokens";
import { isHexColor } from "./color";
import { contrastRatio } from "./contrast";
import { ORG_PRESET_IDS, ORG_PRESET_LIST, ORG_PRESETS, isOrgPresetId } from "./presets";

describe("catálogo de presets", () => {
	it("cada id del array tiene su definición y coinciden", () => {
		for (const id of ORG_PRESET_IDS) {
			expect(ORG_PRESETS[id]).toBeDefined();
			expect(ORG_PRESETS[id].id).toBe(id);
		}
		expect(ORG_PRESET_LIST).toHaveLength(ORG_PRESET_IDS.length);
	});

	it.each(ORG_PRESET_LIST.map((p) => [p.id, p] as const))(
		"%s: hex válidos y contraste AA garantizado",
		(_id, preset) => {
			const { primary, accent, surface, ink } = preset.colors;
			for (const hex of [primary, accent, surface, ink]) {
				expect(isHexColor(hex)).toBe(true);
			}

			const t = buildThemeTokens(preset.colors);
			// texto principal legible SIN corrección (curaduría honesta)
			expect(contrastRatio(ink, surface)).toBeGreaterThanOrEqual(4.5);
			expect(t.ink).toBe(ink);
			// tintas sobre fills legibles
			expect(contrastRatio(t.primaryInk, t.primary)).toBeGreaterThanOrEqual(4.5);
			expect(contrastRatio(t.accentInk, t.accent)).toBeGreaterThanOrEqual(4.5);
			// el primary se distingue del fondo (no invisible)
			expect(contrastRatio(primary, surface)).toBeGreaterThanOrEqual(1.5);
		},
	);

	it("labels y descripciones no vacíos", () => {
		for (const p of ORG_PRESET_LIST) {
			expect(p.label.length).toBeGreaterThan(0);
			expect(p.description.length).toBeGreaterThan(0);
		}
	});
});

describe("isOrgPresetId", () => {
	it("acepta ids del catálogo y rechaza desconocidos (fila vieja en DB)", () => {
		expect(isOrgPresetId("azul-rey")).toBe(true);
		expect(isOrgPresetId("paleta-eliminada-2025")).toBe(false);
		expect(isOrgPresetId("")).toBe(false);
	});
});
