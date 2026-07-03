/**
 * shared/org-theme/presets.ts
 *
 * Catálogo canónico de paletas precuradas para organizaciones.
 * FUENTE ÚNICA de los preset ids válidos (la DB guarda el id; el color vive
 * aquí). Mismo espíritu que shared/skins/registry.ts.
 *
 * Decisión de curaduría (Jocobi, 2026-07-02): TODOS los presets comparten la
 * base TalachaStats (surface #111814, ink #f0f4f2 — la misma de
 * shared/brand/palette.ts) y solo varían primario + acento. Así el salto del
 * portal principal al sitio de una org no es drástico: misma casa, otra
 * camiseta. Un tema con fondo propio sigue siendo posible vía mode="custom".
 *
 * Cada preset son los MISMOS 4 colores que un tema custom (ThemeInput):
 * presets y custom pasan por buildThemeTokens — un solo camino de código.
 * presets.test.ts valida contraste AA de TODAS las paletas: agregar una
 * ilegible rompe CI, no producción.
 *
 * PURO y client-safe.
 */

import type { ThemeInput } from "./build-tokens";

/** Base compartida con la marca TalachaStats (ver shared/brand/palette.ts). */
export const TALACHA_BASE = {
	surface: "#111814",
	ink: "#f0f4f2",
} as const;

export const ORG_PRESET_IDS = [
	"azul-rey",
	"rojinegro",
	"verde-selva",
	"dorado-negro",
	"morado-neon",
	"naranja-fuego",
	"celeste",
	"tinto",
	"rosa-fucsia",
	"turquesa",
	"marino-oro",
] as const;

export type OrgPresetId = (typeof ORG_PRESET_IDS)[number];

export type OrgPresetDefinition = {
	id: OrgPresetId;
	/** Etiqueta para el picker del onboarding/admin. */
	label: string;
	/** Nota interna: intención visual. */
	description: string;
	colors: ThemeInput;
};

function preset(
	id: OrgPresetId,
	label: string,
	description: string,
	primary: string,
	accent: string,
): OrgPresetDefinition {
	return { id, label, description, colors: { primary, accent, ...TALACHA_BASE } };
}

export const ORG_PRESETS: Record<OrgPresetId, OrgPresetDefinition> = {
	"azul-rey": preset(
		"azul-rey",
		"Azul Rey",
		"Azul intenso con acento dorado — clásico de club grande.",
		"#2563eb",
		"#fbbf24",
	),
	rojinegro: preset(
		"rojinegro",
		"Rojinegro",
		"Rojo con acento naranja — carácter de barrio bravo.",
		"#ef4444",
		"#f97316",
	),
	"verde-selva": preset(
		"verde-selva",
		"Verde Selva",
		"Verde césped profundo con acento lima — cancha pura.",
		"#16a34a",
		"#d9f99d",
	),
	"dorado-negro": preset(
		"dorado-negro",
		"Dorado",
		"Oro sobre la base oscura — liga con trofeo en la mira.",
		"#eab308",
		"#f5f5f4",
	),
	"morado-neon": preset(
		"morado-neon",
		"Morado Neón",
		"Violeta brillante con acento cian — nocturno, moderno.",
		"#a78bfa",
		"#22d3ee",
	),
	"naranja-fuego": preset(
		"naranja-fuego",
		"Naranja Fuego",
		"Naranja encendido con acento arena — energía pura.",
		"#f97316",
		"#fde68a",
	),
	celeste: preset(
		"celeste",
		"Celeste",
		"Azul cielo con dorado — elegancia sudamericana.",
		"#0ea5e9",
		"#fbbf24",
	),
	tinto: preset(
		"tinto",
		"Tinto",
		"Guinda profundo con dorado — tradición mexicana.",
		"#b91c1c",
		"#fbbf24",
	),
	"rosa-fucsia": preset(
		"rosa-fucsia",
		"Rosa Fucsia",
		"Fucsia con acento lima — imposible de ignorar.",
		"#ec4899",
		"#a3e635",
	),
	turquesa: preset(
		"turquesa",
		"Turquesa",
		"Verde-azul mineral con ámbar — fresco y distinto.",
		"#14b8a6",
		"#f59e0b",
	),
	"marino-oro": preset(
		"marino-oro",
		"Marino y Oro",
		"Azul marino sobrio con oro — uniforme de gala.",
		"#1d4ed8",
		"#f59e0b",
	),
};

/** Lista ordenada para renderizar el picker. */
export const ORG_PRESET_LIST: readonly OrgPresetDefinition[] = ORG_PRESET_IDS.map(
	(id) => ORG_PRESETS[id],
);

/** Type guard: valida que un string arbitrario (ej. de DB) sea un preset del catálogo. */
export function isOrgPresetId(value: string): value is OrgPresetId {
	return (ORG_PRESET_IDS as readonly string[]).includes(value);
}
