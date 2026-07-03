/**
 * shared/org-theme/presets.ts
 *
 * Catálogo canónico de paletas precuradas para organizaciones.
 * FUENTE ÚNICA de los preset ids válidos (la DB guarda el id; el color vive
 * aquí). Mismo espíritu que shared/skins/registry.ts.
 *
 * Cada preset son los MISMOS 4 colores que un tema custom (ThemeInput):
 * presets y custom pasan por buildThemeTokens — un solo camino de código.
 *
 * Curaduría: paletas pensadas para el look deportivo de la app (superficies
 * oscuras salvo los "clásicos" claros). presets.test.ts valida contraste AA
 * de TODAS — agregar una paleta ilegible rompe el build, no producción.
 *
 * PURO y client-safe.
 */

import type { ThemeInput } from "./build-tokens";

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
	"clasico-claro",
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

export const ORG_PRESETS: Record<OrgPresetId, OrgPresetDefinition> = {
	"azul-rey": {
		id: "azul-rey",
		label: "Azul Rey",
		description: "Azul intenso con acento dorado — clásico de club grande.",
		colors: { primary: "#2563eb", accent: "#fbbf24", surface: "#0b1220", ink: "#eef2f7" },
	},
	rojinegro: {
		id: "rojinegro",
		label: "Rojinegro",
		description: "Rojo sobre negro con acento naranja — carácter de barrio bravo.",
		colors: { primary: "#ef4444", accent: "#f97316", surface: "#141414", ink: "#f5f5f5" },
	},
	"verde-selva": {
		id: "verde-selva",
		label: "Verde Selva",
		description: "Verde césped profundo con acento lima — cancha pura.",
		colors: { primary: "#16a34a", accent: "#d9f99d", surface: "#0c1510", ink: "#eaf5ee" },
	},
	"dorado-negro": {
		id: "dorado-negro",
		label: "Dorado y Negro",
		description: "Oro sobre negro — liga con trofeo en la mira.",
		colors: { primary: "#eab308", accent: "#f5f5f4", surface: "#0f0e0a", ink: "#faf8f0" },
	},
	"morado-neon": {
		id: "morado-neon",
		label: "Morado Neón",
		description: "Violeta brillante con acento cian — nocturno, moderno.",
		colors: { primary: "#a78bfa", accent: "#22d3ee", surface: "#120f1c", ink: "#f1eefc" },
	},
	"naranja-fuego": {
		id: "naranja-fuego",
		label: "Naranja Fuego",
		description: "Naranja encendido con acento arena — energía pura.",
		colors: { primary: "#f97316", accent: "#fde68a", surface: "#16100b", ink: "#fbf3ec" },
	},
	celeste: {
		id: "celeste",
		label: "Celeste",
		description: "Azul cielo con dorado — elegancia sudamericana.",
		colors: { primary: "#0ea5e9", accent: "#fbbf24", surface: "#0a141b", ink: "#ebf6fc" },
	},
	tinto: {
		id: "tinto",
		label: "Tinto",
		description: "Guinda profundo con dorado — tradición mexicana.",
		colors: { primary: "#b91c1c", accent: "#fbbf24", surface: "#170d0d", ink: "#f9eeee" },
	},
	"rosa-fucsia": {
		id: "rosa-fucsia",
		label: "Rosa Fucsia",
		description: "Fucsia con acento lima — imposible de ignorar.",
		colors: { primary: "#ec4899", accent: "#a3e635", surface: "#170d13", ink: "#fdeef6" },
	},
	turquesa: {
		id: "turquesa",
		label: "Turquesa",
		description: "Verde-azul mineral con ámbar — fresco y distinto.",
		colors: { primary: "#14b8a6", accent: "#f59e0b", surface: "#0a1514", ink: "#ecfbf9" },
	},
	"marino-oro": {
		id: "marino-oro",
		label: "Marino y Oro",
		description: "Azul marino sobrio con oro — uniforme de gala.",
		colors: { primary: "#1d4ed8", accent: "#f59e0b", surface: "#0a0f1e", ink: "#eef1f9" },
	},
	"clasico-claro": {
		id: "clasico-claro",
		label: "Clásico Claro",
		description: "Fondo claro tipo periódico deportivo con verde bosque.",
		colors: { primary: "#166534", accent: "#b45309", surface: "#f6f5f0", ink: "#1c1e1c" },
	},
};

/** Lista ordenada para renderizar el picker. */
export const ORG_PRESET_LIST: readonly OrgPresetDefinition[] = ORG_PRESET_IDS.map(
	(id) => ORG_PRESETS[id],
);

/** Type guard: valida que un string arbitrario (ej. de DB) sea un preset del catálogo. */
export function isOrgPresetId(value: string): value is OrgPresetId {
	return (ORG_PRESET_IDS as readonly string[]).includes(value);
}
