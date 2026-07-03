/**
 * features/org-theming/lib/resolve-theme-input.ts
 *
 * Frontera de confianza entre la DB y el catálogo en código (mismo patrón
 * que tournament-skin/resolve-skin-id): una fila puede referir un preset que
 * ya no existe, o hex corruptos que se saltaron la validación. En cualquier
 * caso degradamos en silencio a null (paleta TalachaStats) — la página
 * pública de una org NUNCA truena por su tema.
 */

import { isHexColor, ORG_PRESETS, isOrgPresetId, type ThemeInput } from "@/shared/org-theme";

/** Subconjunto estructural de la fila de DB — testeable sin drizzle. */
export type OrgThemeRow = {
	mode: string;
	presetId: string | null;
	colorPrimary: string | null;
	colorAccent: string | null;
	colorSurface: string | null;
	colorInk: string | null;
};

export function resolveThemeInput(row: OrgThemeRow | null | undefined): ThemeInput | null {
	if (!row) return null;

	if (row.mode === "preset") {
		if (!row.presetId || !isOrgPresetId(row.presetId)) return null;
		return ORG_PRESETS[row.presetId].colors;
	}

	if (row.mode === "custom") {
		const { colorPrimary, colorAccent, colorSurface, colorInk } = row;
		if (!colorPrimary || !colorAccent || !colorSurface || !colorInk) return null;
		const colors = [colorPrimary, colorAccent, colorSurface, colorInk];
		if (!colors.every((c) => isHexColor(c))) return null;
		return {
			primary: colorPrimary.toLowerCase(),
			accent: colorAccent.toLowerCase(),
			surface: colorSurface.toLowerCase(),
			ink: colorInk.toLowerCase(),
		};
	}

	return null; // modo desconocido (fila de una versión futura/vieja)
}
