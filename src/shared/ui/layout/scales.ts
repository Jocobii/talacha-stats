// Escala canónica de layout — fuente única (docs/FRONTEND-UI-REFACTOR-PLAN.md §4 Fase 0).
// No inventar valores de gap/padding fuera de esta tabla.

export const GAP = {
	none: "gap-0",
	xs: "gap-1",
	sm: "gap-2",
	md: "gap-4",
	lg: "gap-6",
	xl: "gap-8",
} as const;

export const PAD = {
	none: "p-0",
	xs: "p-1",
	sm: "p-2",
	md: "p-4",
	lg: "p-6",
	xl: "p-8",
} as const;

export const ALIGN = {
	start: "items-start",
	center: "items-center",
	end: "items-end",
	stretch: "items-stretch",
} as const;

export const JUSTIFY = {
	start: "justify-start",
	center: "justify-center",
	end: "justify-end",
	between: "justify-between",
	around: "justify-around",
} as const;

export type GapToken = keyof typeof GAP;
export type PadToken = keyof typeof PAD;
export type AlignToken = keyof typeof ALIGN;
export type JustifyToken = keyof typeof JUSTIFY;
