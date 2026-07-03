/**
 * shared/org-theme/css-vars.ts
 *
 * Proyección CSS de los tokens de tema. Mapea OrgThemeTokens al CONTRATO
 * EXISTENTE de tokens skin (`--color-skin-*` en globals.css) — los
 * componentes que ya usan utilidades skin (bg-skin-surface,
 * text-skin-primary-ink…) se tematizan sin tocarlos.
 *
 * Se usa para `mode="custom"` (inline style en OrgThemeScope). Los presets
 * no pasan por aquí en runtime: viven como bloques [data-org-theme] en
 * globals.css (cero JS) — pero el script/bloque CSS de cada preset se
 * genera con ESTE mismo mapeo para no divergir.
 */

import type { OrgThemeTokens } from "./build-tokens";

export function tokensToCssVars(tokens: OrgThemeTokens): Record<string, string> {
	return {
		"--color-skin-primary": tokens.primary,
		"--color-skin-primary-ink": tokens.primaryInk,
		"--color-skin-accent": tokens.accent,
		"--color-skin-surface": tokens.surface,
		"--color-skin-surface-2": tokens.surface2,
		"--color-skin-line": tokens.line,
		"--tint-skin": tokens.tint,
		"--tint-skin-bd": tokens.tintBd,
	};
}

/** Bloque CSS de un preset para pegar en globals.css:
 *  `[data-org-theme="azul-rey"] { --color-skin-primary: …; }`
 *  Herramienta de build/curaduría — no se llama en runtime. */
export function tokensToCssBlock(selector: string, tokens: OrgThemeTokens): string {
	const vars = tokensToCssVars(tokens);
	const lines = Object.entries(vars)
		.map(([k, v]) => `\t${k}: ${v};`)
		.join("\n");
	return `${selector} {\n${lines}\n}`;
}
