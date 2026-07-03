/**
 * shared/org-theme/fonts.ts
 *
 * Catálogo cerrado de tipografías por organización (docs/ORG-THEMING.md §3.2).
 * Cerrado por dos razones: performance (todas se declaran con next/font en el
 * root layout, subseteadas) y Satori (las rutas de imagen necesitan el BUFFER
 * del archivo de fuente — imposible con fuentes arbitrarias por tenant).
 *
 * Wiring pendiente (paso 3 del plan): declarar cada googleFamily con
 * next/font/google en el root layout usando `variable:` con el cssVariable
 * de aquí. `satoriFiles` queda null hasta que los .ttf estén en el repo —
 * mientras tanto las imágenes usan su fuente default (degradación silenciosa).
 *
 * PURO y client-safe.
 */

export const ORG_FONT_IDS = ["brand", "marcador", "moderna", "slab"] as const;

export type OrgFontId = (typeof ORG_FONT_IDS)[number];

export type OrgFontDefinition = {
	id: OrgFontId;
	/** Etiqueta para el picker. */
	label: string;
	/** Nota interna: intención visual. */
	description: string;
	/** Familia de Google Fonts (licencia OFL). null = stack default de la app. */
	googleFamily: string | null;
	/** CSS variable que declara next/font en el root layout. null = sin clase extra. */
	cssVariable: string | null;
	/** Paths de los archivos para ImageResponse({ fonts }) — relativos al repo.
	 *  null = Satori usa su fuente default. */
	satoriFiles: { regular: string; bold: string } | null;
};

export const ORG_FONTS: Record<OrgFontId, OrgFontDefinition> = {
	brand: {
		id: "brand",
		label: "TalachaStats",
		description: "La tipografía default de la plataforma.",
		googleFamily: null,
		cssVariable: null,
		satoriFiles: null,
	},
	marcador: {
		id: "marcador",
		label: "Marcador",
		description: "Condensed alta, tipo marcador de estadio.",
		googleFamily: "Oswald",
		cssVariable: "--font-org-marcador",
		satoriFiles: null,
	},
	moderna: {
		id: "moderna",
		label: "Moderna",
		description: "Geométrica limpia, look de club europeo actual.",
		googleFamily: "Archivo",
		cssVariable: "--font-org-moderna",
		satoriFiles: null,
	},
	slab: {
		id: "slab",
		label: "Slab",
		description: "Serif robusta con carácter, prensa deportiva.",
		googleFamily: "Zilla Slab",
		cssVariable: "--font-org-slab",
		satoriFiles: null,
	},
};

export const ORG_FONT_LIST: readonly OrgFontDefinition[] = ORG_FONT_IDS.map((id) => ORG_FONTS[id]);

/** Type guard: valida que un string arbitrario (ej. de DB) sea una fuente del catálogo. */
export function isOrgFontId(value: string): value is OrgFontId {
	return (ORG_FONT_IDS as readonly string[]).includes(value);
}
