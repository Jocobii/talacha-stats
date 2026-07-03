/**
 * shared/org-theme/css-vars.ts
 *
 * Proyección CSS de los tokens de tema. Presets y custom van por el MISMO
 * camino: vars inline resueltas en SSR (OrgThemeScope) — sin bloques CSS
 * por preset que puedan divergir del catálogo, y sin FOUC porque el HTML
 * ya llega pintado.
 *
 * Dos niveles de override:
 * - tokensToCssVars: solo el contrato skin (--color-skin-*) — módulos
 *   tematizables opt-in, igual que tournament-skin.
 * - tokensToScopeCssVars: contrato skin + TOKENS BASE (--color-pitch,
 *   --color-surface, --color-ink, --color-brand…) — retematiza TODA la
 *   experiencia pública de la org sin tocar componentes existentes.
 */

import { desaturate, mix, withAlpha } from "./color";
import { ensureContrast, relativeLuminance } from "./contrast";
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

/**
 * Override COMPLETO para el scope de una organización: contrato skin + los
 * tokens base que usan todos los componentes públicos (bg-pitch, text-ink,
 * bg-surface, text-brand-ink…). Dentro de <OrgThemeScope> la app entera se
 * pinta con la identidad de la org; fuera, nada cambia.
 *
 * Derivaciones extra (no persistidas, deterministas):
 * - pitch: fondo de página, más profundo que surface (dirección según tema
 *   claro/oscuro)
 * - brand-ink: el primary ajustado para ser LEGIBLE como texto sobre surface
 */
export function tokensToScopeCssVars(tokens: OrgThemeTokens): Record<string, string> {
	const surfaceIsDark = relativeLuminance(tokens.surface) < 0.5;

	// ── Dosis, no saturación total ──────────────────────────────────────────
	// El color de marca va COMPLETO solo en fills (botones, badges). Para
	// texto y derivados se suaviza: mezclado hacia la tinta y desaturado —
	// evita la página "neón" cuando el primary es intenso.
	const softSurface = desaturate(tokens.surface, 0.35); // fondos casi neutros
	const softInk = ensureContrast(desaturate(tokens.ink, 0.4), softSurface, 4.5);
	const brandText = ensureContrast(
		mix(desaturate(tokens.primary, 0.25), softInk, 0.3),
		softSurface,
		4.5,
	);

	return {
		...tokensToCssVars(tokens),
		// Superficies — apenas un tinte del tema, no un baño de color
		"--color-pitch": mix(softSurface, "#000000", surfaceIsDark ? 0.38 : 0.05),
		"--color-surface": softSurface,
		"--color-surface-2": mix(softSurface, softInk, 0.06),
		"--color-surface-3": mix(softSurface, softInk, 0.1),
		"--color-line": mix(softSurface, softInk, 0.14),
		"--color-line-2": mix(softSurface, softInk, 0.24),
		// Tinta — el ink desaturado deja de arrastrar el matiz a todo el texto
		"--color-ink": softInk,
		"--color-ink-2": ensureContrast(mix(softInk, softSurface, 0.38), softSurface, 3),
		"--color-ink-3": mix(softInk, softSurface, 0.55),
		// Marca de la org: fill íntegro, texto suavizado
		"--color-brand": tokens.primary,
		"--color-brand-dim": mix(tokens.primary, "#000000", 0.25),
		"--color-brand-ink": brandText,
		"--tint-brand": withAlpha(tokens.primary, 0.09),
		"--tint-brand-bd": withAlpha(tokens.primary, 0.22),
	};
}

/** Bloque CSS de un tema para tooling/depuración (no se llama en runtime). */
export function tokensToCssBlock(selector: string, tokens: OrgThemeTokens): string {
	const vars = tokensToCssVars(tokens);
	const lines = Object.entries(vars)
		.map(([k, v]) => `\t${k}: ${v};`)
		.join("\n");
	return `${selector} {\n${lines}\n}`;
}
