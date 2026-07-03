import { describe, expect, it } from "vitest";
import { buildThemeTokens } from "./build-tokens";
import { tokensToCssBlock, tokensToCssVars } from "./css-vars";
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

describe("tokensToCssBlock", () => {
	it("genera un bloque CSS válido con el selector dado", () => {
		const block = tokensToCssBlock('[data-org-theme="azul-rey"]', TOKENS);
		expect(block).toContain('[data-org-theme="azul-rey"] {');
		expect(block).toContain(`--color-skin-primary: ${TOKENS.primary};`);
		expect(block.trim().endsWith("}")).toBe(true);
	});
});
