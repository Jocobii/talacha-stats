// Escala canónica de tipografía — fuente única (docs/FRONTEND-UI-REFACTOR-PLAN.md Fase 1b).
// No inventar tamaños/pesos/tonos/variantes fuera de esta tabla.

import type { ElementType } from "react";

type VariantPreset = { as: ElementType; className: string };

/** Cada variante resuelve tag semántico + tamaño + peso + fuente en un solo lugar.
 *  `weight`/`as` en `Typography` pueden sobreescribir el preset puntualmente. */
export const TYPOGRAPHY_VARIANTS = {
	display: {
		as: "h1",
		className: "font-display text-3xl sm:text-[34px] font-black leading-none tracking-tight",
	},
	h2: {
		as: "h2",
		className: "font-display text-2xl font-black leading-tight tracking-tight",
	},
	h3: {
		as: "h3",
		className: "font-display text-xl font-bold leading-tight tracking-tight",
	},
	h4: {
		as: "h4",
		className: "font-display text-lg font-bold leading-snug tracking-tight",
	},
	lead: { as: "p", className: "text-lg font-normal" },
	body: { as: "p", className: "text-base font-normal" },
	bodySm: { as: "p", className: "text-sm font-normal" },
	caption: { as: "span", className: "text-xs font-normal" },
} satisfies Record<string, VariantPreset>;

export const WEIGHT = {
	normal: "font-normal",
	medium: "font-medium",
	semibold: "font-semibold",
	bold: "font-bold",
	black: "font-black",
} as const;

export const TONE = {
	ink: "text-ink",
	"ink-2": "text-ink-2",
	"ink-3": "text-ink-3",
	brand: "text-brand-ink",
	danger: "text-red-400",
	warn: "text-amber-300",
} as const;

export type TypographyVariant = keyof typeof TYPOGRAPHY_VARIANTS;
export type Weight = keyof typeof WEIGHT;
export type Tone = keyof typeof TONE;
