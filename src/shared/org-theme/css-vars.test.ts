import { describe, expect, it } from "vitest";
import { buildThemeTokens } from "./build-tokens";
import { contrastRatio, relativeLuminance } from "./contrast";
import { tokensToCssBlock, tokensToCssVars, tokensToScopeCssVars } from "./css-vars";
import { ORG_PRESETS } from "./presets";

const TOKENS = buildThemeTokens(ORG_PRESETS["azul-rey"].colors);

describe("tokensToCssVars", () => {
	it("mapea exactamente al contrato de tokens skin de globals.css", () => {
		const vars = tokensToCssVars(TOKENS);
		expect(Object.keys(vars).sort()).toEqual(
			[
				"--color-skin-accent",
				"--color-skin-line",
				"--color-skin-primary",
				"--color-skin-primary-ink",
				"--color-skin-surface",
				"--color-skin-surface-2",
				"--tint-skin",
				"--tint-skin-bd",
			].sort(),
		);
		expect(vars["--color-skin-primary"]).toBe(TOKENS.primary);
		expect(vars["--tint-skin"]).toBe(TOKENS.tint);
	});
});

describe("tokensToScopeCssVars", () => {
	it("incluye el contrato skin Y los tokens base", () => {
		const vars = tokensToScopeCssVars(TOKENS);
		for (const key of [
			"--color-skin-primary",
			"--color-pitch",
			"--color-surface",
			"--color-ink",
			"--color-ink-2",
			"--color-brand",
			"--color-brand-ink",
			"--tint-brand",
		]) {
			expect(vars[key], `falta ${key}`).toBeDefined();
		}
	});

	it("pitch es más profundo que surface (tema oscuro)", () => {
		const vars = tokensToScopeCssVars(TOKENS);
		expect(relativeLuminance(vars["--color-pitch"])).toBeLessThan(
			relativeLuminance(vars["--color-surface"]),
		);
	});

	it("brand-ink es legible como texto sobre surface (AA)", () => {
		for (const preset of Object.values(ORG_PRESETS)) {
			const vars = tokensToScopeCssVars(buildThemeTokens(preset.colors));
			expect(
				contrastRatio(vars["--color-brand-ink"], vars["--color-surface"]),
				`brand-ink ilegible en preset ${preset.id}`,
			).toBeGreaterThanOrEqual(4.5);
		}
	});
});

describe("tokensToCssBlock", () => {
	it("genera un bloque CSS válido con el selector dado", () => {
		const block = tokensToCssBlock('[data-org-theme="azul-rey"]', TOKENS);
		expect(block).toContain('[data-org-theme="azul-rey"] {');
		expect(block).toContain(`--color-skin-primary: ${TOKENS.primary};`);
		expect(block.trim().endsWith("}")).toBe(true);
	});
});
