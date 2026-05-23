/**
 * shared/brand/palette.ts
 * Paleta de colores canónica de TalachaStats para renders satori/ImageResponse.
 * FUENTE ÚNICA — no reimplementar en cada route de imagen.
 */
export const BRAND_PALETTE = {
	bg: "#0a0f0d",
	surface: "#111814",
	surfaceAlt: "#162019",
	brand: "#00e676",
	ink: "#f0f4f2",
	inkDim: "#8a9e93",
	inkMuted: "#4a5e53",
	gold: "#fbbf24",
	silver: "#9ca3af",
	bronze: "#b45309",
	border: "#1e2b23",
} as const;

export type BrandPalette = typeof BRAND_PALETTE;
