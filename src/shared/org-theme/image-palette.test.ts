import { describe, expect, it } from "vitest";
import { BRAND_PALETTE } from "@/shared/brand/palette";
import { buildThemeTokens } from "./build-tokens";
import { contrastRatio } from "./contrast";
import { imagePaletteFromTokens } from "./image-palette";
import { ORG_PRESETS } from "./presets";

describe("imagePaletteFromTokens", () => {
	it("cubre exactamente el contrato de BRAND_PALETTE", () => {
		const palette = imagePaletteFromTokens(buildThemeTokens(ORG_PRESETS["azul-rey"].colors));
		expect(Object.keys(palette).sort()).toEqual(Object.keys(BRAND_PALETTE).sort());
	});

	it("el podio no se tematiza (gold/silver/bronze fijos)", () => {
		const palette = imagePaletteFromTokens(buildThemeTokens(ORG_PRESETS["rosa-fucsia"].colors));
		expect(palette.gold).toBe(BRAND_PALETTE.gold);
		expect(palette.silver).toBe(BRAND_PALETTE.silver);
		expect(palette.bronze).toBe(BRAND_PALETTE.bronze);
	});

	it("brand va íntegro (punchy) y el texto es legible en todos los presets", () => {
		for (const preset of Object.values(ORG_PRESETS)) {
			const palette = imagePaletteFromTokens(buildThemeTokens(preset.colors));
			expect(palette.brand).toBe(preset.colors.primary);
			expect(
				contrastRatio(palette.ink, palette.surface),
				`ink ilegible en ${preset.id}`,
			).toBeGreaterThanOrEqual(4.5);
		}
	});
});
