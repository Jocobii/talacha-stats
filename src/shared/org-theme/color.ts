/**
 * shared/org-theme/color.ts
 *
 * Aritmética de color base para el sistema de temas por organización.
 * PURO y client-safe: sin imports de @/db ni de React.
 *
 * Convención: todos los colores de entrada/salida son hex `#rrggbb` en
 * minúsculas salvo `withAlpha`, que emite `rgba(...)` para tints.
 */

export const HEX_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;

export type Rgb = { r: number; g: number; b: number };
export type Hsl = { h: number; s: number; l: number };

export function isHexColor(value: string): boolean {
	return HEX_COLOR_REGEX.test(value);
}

/** Parsea `#rrggbb`. Lanza para formatos inválidos — los inputs de usuario
 *  deben validarse con Zod ANTES de llegar aquí; esto atrapa bugs de programador. */
export function parseHex(hex: string): Rgb {
	if (!isHexColor(hex)) {
		throw new Error(`Color hex inválido: "${hex}" (se espera #rrggbb)`);
	}
	return {
		r: parseInt(hex.slice(1, 3), 16),
		g: parseInt(hex.slice(3, 5), 16),
		b: parseInt(hex.slice(5, 7), 16),
	};
}

export function toHex({ r, g, b }: Rgb): string {
	const c = (n: number) =>
		Math.max(0, Math.min(255, Math.round(n)))
			.toString(16)
			.padStart(2, "0");
	return `#${c(r)}${c(g)}${c(b)}`;
}

/** Mezcla lineal en RGB: weight=0 → a, weight=1 → b. */
export function mix(a: string, b: string, weight: number): string {
	const w = Math.max(0, Math.min(1, weight));
	const ca = parseHex(a);
	const cb = parseHex(b);
	return toHex({
		r: ca.r + (cb.r - ca.r) * w,
		g: ca.g + (cb.g - ca.g) * w,
		b: ca.b + (cb.b - ca.b) * w,
	});
}

/** Hex → `rgba(r, g, b, alpha)` para tints y bordes translúcidos. */
export function withAlpha(hex: string, alpha: number): string {
	const { r, g, b } = parseHex(hex);
	const a = Math.max(0, Math.min(1, alpha));
	return `rgba(${r}, ${g}, ${b}, ${a})`;
}

export function rgbToHsl({ r, g, b }: Rgb): Hsl {
	const rn = r / 255;
	const gn = g / 255;
	const bn = b / 255;
	const max = Math.max(rn, gn, bn);
	const min = Math.min(rn, gn, bn);
	const l = (max + min) / 2;
	if (max === min) return { h: 0, s: 0, l };
	const d = max - min;
	const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
	let h: number;
	if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
	else if (max === gn) h = ((bn - rn) / d + 2) / 6;
	else h = ((rn - gn) / d + 4) / 6;
	return { h, s, l };
}

export function hslToRgb({ h, s, l }: Hsl): Rgb {
	if (s === 0) {
		const v = l * 255;
		return { r: v, g: v, b: v };
	}
	const hue2rgb = (p: number, q: number, t: number) => {
		let tn = t;
		if (tn < 0) tn += 1;
		if (tn > 1) tn -= 1;
		if (tn < 1 / 6) return p + (q - p) * 6 * tn;
		if (tn < 1 / 2) return q;
		if (tn < 2 / 3) return p + (q - p) * (2 / 3 - tn) * 6;
		return p;
	};
	const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
	const p = 2 * l - q;
	return {
		r: hue2rgb(p, q, h + 1 / 3) * 255,
		g: hue2rgb(p, q, h) * 255,
		b: hue2rgb(p, q, h - 1 / 3) * 255,
	};
}
