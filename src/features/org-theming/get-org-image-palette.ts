/**
 * features/org-theming/get-org-image-palette.ts
 *
 * Paleta para las rutas de imagen (Satori). Resuelve el tema de la org y lo
 * proyecta al contrato BRAND_PALETTE; sin tema (o fila irresoluble) devuelve
 * BRAND_PALETTE — las imágenes se ven exactamente como hoy.
 *
 * `cache()` deduplica por request (una imagen puede pedir la paleta desde
 * varios helpers).
 */

import { cache } from "react";
import { findOrgThemeByOrgId } from "@/entities/organization";
import { BRAND_PALETTE } from "@/shared/brand/palette";
import { buildThemeTokens, imagePaletteFromTokens, type ImagePalette } from "@/shared/org-theme";
import { resolveThemeInput } from "./lib/resolve-theme-input";

export const getOrgImagePalette = cache(
	async (organizationId: string | null | undefined): Promise<ImagePalette> => {
		if (!organizationId) return BRAND_PALETTE;

		const row = await findOrgThemeByOrgId(organizationId);
		const input = resolveThemeInput(row);
		if (!input) return BRAND_PALETTE;

		return imagePaletteFromTokens(buildThemeTokens(input));
	},
);
