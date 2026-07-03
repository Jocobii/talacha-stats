/**
 * shared/org-theme/contrast.ts
 *
 * Matemática de contraste WCAG 2.x para temas de organización.
 * PURO y client-safe: la usan tanto el server (resolver tokens) como el
 * cliente (preview en vivo del onboarding). Determinista: mismo input,
 * mismo output — CSS y Satori siempre coinciden.
 */

import { hslToRgb, parseHex, rgbToHsl, toHex } from "./color";

/** Tintas canónicas para texto sobre fills de color (botones, badges). */
export const INK_LIGHT = "#f7f9f8";
export const INK_DARK = "#101312";

/** Luminancia relativa WCAG 2.x (0 = negro, 1 = blanco). */
export function relativeLuminance(hex: string): number {
	const { r, g, b } = parseHex(hex);
	const channel = (v: number) => {
		const c = v / 255;
		return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
	};
	return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** Ratio de contraste WCAG (1..21). Simétrico: no importa el orden. */
export function contrastRatio(a: string, b: string): number {
	const la = relativeLuminance(a);
	const lb = relativeLuminance(b);
	const [hi, lo] = la >= lb ? [la, lb] : [lb, la];
	return (hi + 0.05) / (lo + 0.05);
}

/** Tinta legible sobre un fondo arbitrario: la clara o la oscura, la que
 *  contraste más. Para texto sobre primary/accent (primaryInk, accentInk). */
export function inkOn(bg: string): string {
	return contrastRatio(INK_LIGHT, bg) >= contrastRatio(INK_DARK, bg) ? INK_LIGHT : INK_DARK;
}

/**
 * Garantiza contraste mínimo de `fg` sobre `bg` ajustando la LIGHTNESS de
 * `fg` (conserva matiz y saturación — el color sigue "sintiéndose" suyo).
 * Determinista: mueve L en pasos fijos hacia el extremo que aumenta el
 * contraste. Si ni en el extremo alcanza, cae a `inkOn(bg)` — nunca
 * devuelve un color ilegible.
 */
export function ensureContrast(fg: string, bg: string, min = 4.5): string {
	if (contrastRatio(fg, bg) >= min) return fg;

	const bgIsLight = relativeLuminance(bg) > 0.5;
	const step = bgIsLight ? -0.02 : 0.02;
	const hsl = rgbToHsl(parseHex(fg));

	let l = hsl.l;
	for (let i = 0; i < 50; i++) {
		l = Math.max(0, Math.min(1, l + step));
		const candidate = toHex(hslToRgb({ ...hsl, l }));
		if (contrastRatio(candidate, bg) >= min) return candidate;
		if (l === 0 || l === 1) break;
	}
	return inkOn(bg);
}
