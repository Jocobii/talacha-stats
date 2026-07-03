/**
 * features/org-theming/get-org-theme.ts
 *
 * Punto de entrada server-side del tema de una organización. Los Server
 * Components lo llaman directo (sin hop HTTP); `cache()` deduplica por
 * request — layout + páginas + rutas de imagen en el mismo render cuestan
 * UNA query indexada.
 */

import { cache } from "react";
import { findOrgThemeBySlug } from "@/entities/organization";
import {
	buildThemeTokens,
	isOrgFontId,
	type OrgFontId,
	type OrgThemeTokens,
	type ThemeInput,
} from "@/shared/org-theme";
import { resolveThemeInput } from "./lib/resolve-theme-input";

export type ResolvedOrgTheme = {
	/** Los 4 colores fuente — útiles para reenviar el tema (ej. /api/og en edge). */
	input: ThemeInput;
	tokens: OrgThemeTokens;
	fontId: OrgFontId;
};

/** null = la org no tiene tema (o su fila es irresoluble) → paleta TalachaStats. */
export const getOrgTheme = cache(async (slug: string): Promise<ResolvedOrgTheme | null> => {
	const row = await findOrgThemeBySlug(slug);
	const input = resolveThemeInput(row);
	if (!input) return null;

	return {
		input,
		tokens: buildThemeTokens(input),
		fontId: row && isOrgFontId(row.fontId) ? row.fontId : "brand",
	};
});
