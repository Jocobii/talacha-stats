/**
 * shared/org-theme/image-palette.ts
 *
 * Proyección Satori del tema (docs/ORG-THEMING.md §7): mapea OrgThemeTokens
 * al MISMO contrato de BRAND_PALETTE que ya consumen las rutas de imagen
 * (/api/content/*-image, /api/og). Puro y testeable.
 *
 * A diferencia del scope CSS (tokensToScopeCssVars, suavizado), aquí los
 * colores van ÍNTEGROS a propósito: en un asset para WhatsApp/Facebook el
 * color intenso es virtud, no ruido.
 *
 * gold/silver/bronze NO se tematizan: son semánticos del podio.
 */

import { BRAND_PALETTE } from "@/shared/brand/palette";
import type { OrgThemeTokens } from "./build-tokens";
import { mix } from "./color";

/** Forma de BRAND_PALETTE con valores arbitrarios (BrandPalette es literal). */
export type ImagePalette = Record<keyof typeof BRAND_PALETTE, string>;

export function imagePaletteFromTokens(tokens: OrgThemeTokens): ImagePalette {
	return {
		bg: mix(tokens.surface, "#000000", 0.38),
		surface: tokens.surface,
		surfaceAlt: tokens.surface2,
		brand: tokens.primary,
		ink: tokens.ink,
		inkDim: tokens.inkDim,
		inkMuted: mix(tokens.ink, tokens.surface, 0.55),
		gold: BRAND_PALETTE.gold,
		silver: BRAND_PALETTE.silver,
		bronze: BRAND_PALETTE.bronze,
		border: tokens.line,
	};
}
