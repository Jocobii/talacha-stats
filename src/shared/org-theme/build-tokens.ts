/**
 * shared/org-theme/build-tokens.ts
 *
 * FUENTE ÚNICA de derivación de tokens de tema (docs/ORG-THEMING.md §1, §4).
 * Recibe los 4 colores base (preset o custom) y calcula TODO lo derivado:
 * tintas legibles, superficies secundarias, líneas, tints. Nada de esto se
 * guarda en DB — se calcula siempre, así CSS y Satori nunca divergen.
 *
 * PURO y client-safe.
 */

import { mix, withAlpha } from "./color";
import { contrastRatio, ensureContrast, inkOn } from "./contrast";

/** Los 4 colores que definen un tema — lo ÚNICO que se persiste. */
export type ThemeInput = {
	/** Color de marca de la org: botones, headers, highlights. */
	primary: string;
	/** Acento secundario: badges, detalles, líder de tabla. */
	accent: string;
	/** Fondo base de superficies (cards, paneles). */
	surface: string;
	/** Texto principal sobre surface. */
	ink: string;
};

/** Tokens resueltos, listos para proyectarse a CSS vars o a Satori. */
export type OrgThemeTokens = {
	primary: string;
	/** Texto sobre fills primary (garantizado legible). */
	primaryInk: string;
	accent: string;
	/** Texto sobre fills accent (garantizado legible). */
	accentInk: string;
	surface: string;
	/** Superficie elevada (cards sobre cards). */
	surface2: string;
	/** Texto principal — auto-corregido a AA si el input no cumplía. */
	ink: string;
	/** Texto secundario (labels, metadatos) — mínimo 3:1. */
	inkDim: string;
	/** Bordes y divisores. */
	line: string;
	/** Fondo translúcido del primary (chips, filas destacadas). */
	tint: string;
	/** Borde translúcido del primary. */
	tintBd: string;
};

const AA_TEXT = 4.5;
const AA_LARGE = 3;

export function buildThemeTokens(input: ThemeInput): OrgThemeTokens {
	const surface = input.surface;

	// Texto principal: si el organizador eligió una combinación ilegible,
	// se corrige aquí (determinista) — nunca se renderiza un tema ilegible.
	const ink = ensureContrast(input.ink, surface, AA_TEXT);

	// Texto secundario: ink mezclado hacia surface, garantizando 3:1 (AA large).
	const inkDim = ensureContrast(mix(ink, surface, 0.38), surface, AA_LARGE);

	return {
		primary: input.primary,
		primaryInk: inkOn(input.primary),
		accent: input.accent,
		accentInk: inkOn(input.accent),
		surface,
		surface2: mix(surface, ink, 0.06),
		ink,
		inkDim,
		line: mix(surface, ink, 0.14),
		tint: withAlpha(input.primary, 0.12),
		tintBd: withAlpha(input.primary, 0.3),
	};
}

/** Diagnóstico para el preview del onboarding: ratios que la UI muestra
 *  como warnings ("este texto no cumple AA"). La UI recibe números ya
 *  calculados — no hace matemática (docs/ORG-THEMING.md §6). */
export type ThemeContrastReport = {
	inkOnSurface: number;
	primaryInkOnPrimary: number;
	accentInkOnAccent: number;
	primaryOnSurface: number;
	/** true si `ink` del input tuvo que corregirse. */
	inkWasAdjusted: boolean;
};

export function reportThemeContrast(input: ThemeInput): ThemeContrastReport {
	const tokens = buildThemeTokens(input);
	return {
		inkOnSurface: contrastRatio(tokens.ink, tokens.surface),
		primaryInkOnPrimary: contrastRatio(tokens.primaryInk, tokens.primary),
		accentInkOnAccent: contrastRatio(tokens.accentInk, tokens.accent),
		primaryOnSurface: contrastRatio(tokens.primary, tokens.surface),
		inkWasAdjusted: tokens.ink !== input.ink,
	};
}
