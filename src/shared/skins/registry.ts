/**
 * shared/skins/registry.ts
 *
 * Catálogo canónico de skins de torneo. FUENTE ÚNICA de los ids válidos.
 *
 * Un skin = un id + metadata. Lo VISUAL de cada skin vive en globals.css como
 * bloque `[data-skin="<id>"]` que sobreescribe los tokens --color-skin-* /
 * --tint-skin-*. Cero JS en runtime: agregar un skin no agrega peso al bundle.
 *
 * Para agregar un torneo nuevo ver docs/TOURNAMENT-SKINS.md (2 pasos:
 * entrada aquí + bloque CSS en globals.css).
 *
 * Este módulo es PURO y client-safe: sin imports de @/db ni de React.
 */

export const SKIN_IDS = ["mundial-2026"] as const;

export type SkinId = (typeof SKIN_IDS)[number];

export type SkinDefinition = {
	id: SkinId;
	/** Etiqueta para el admin y selects. */
	label: string;
	/** Nota interna: intención visual del skin. */
	description: string;
};

export const SKINS: Record<SkinId, SkinDefinition> = {
	"mundial-2026": {
		id: "mundial-2026",
		label: "Mundial 2026",
		description:
			"Inspirado en el look del torneo: negro + dorado trofeo, con acentos rojo y azul de las sedes. Sin marcas ni logos de terceros.",
	},
};

/** Type guard: valida que un string arbitrario (ej. de DB) sea un skin del registry. */
export function isSkinId(value: string): value is SkinId {
	return (SKIN_IDS as readonly string[]).includes(value);
}
