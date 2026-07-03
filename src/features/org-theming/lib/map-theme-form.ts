/**
 * features/org-theming/lib/map-theme-form.ts
 *
 * Mapeos form ↔ fila/DTO. Puro y client-safe.
 */

import { isOrgFontId, isOrgPresetId, ORG_PRESET_IDS } from "@/shared/org-theme";
import type { ThemeFormInput } from "../model/theme-form-schema";
import type { OrgThemeDto } from "../types";

/** Valores listos para upsertOrgTheme (columnas de organization_themes). */
export type ThemeRowValues = {
	mode: "preset" | "custom";
	presetId: string | null;
	colorPrimary: string | null;
	colorAccent: string | null;
	colorSurface: string | null;
	colorInk: string | null;
	fontId: string;
};

export function themeFormToRowValues(input: ThemeFormInput): ThemeRowValues {
	if (input.mode === "preset") {
		return {
			mode: "preset",
			presetId: input.presetId,
			colorPrimary: null,
			colorAccent: null,
			colorSurface: null,
			colorInk: null,
			fontId: input.fontId,
		};
	}
	return {
		mode: "custom",
		presetId: null,
		colorPrimary: input.colorPrimary,
		colorAccent: input.colorAccent,
		colorSurface: input.colorSurface,
		colorInk: input.colorInk,
		fontId: input.fontId,
	};
}

/** Form inicial cuando la org aún no tiene tema. */
export const DEFAULT_THEME_FORM: ThemeFormInput = {
	mode: "preset",
	presetId: ORG_PRESET_IDS[0],
	fontId: "brand",
};

/** DTO de DB → valores del form. Filas irresolubles (preset retirado, hex
 *  corrupto) caen al default — mismo espíritu que resolveThemeInput. */
export function dtoToThemeForm(dto: OrgThemeDto | null | undefined): ThemeFormInput {
	if (!dto) return DEFAULT_THEME_FORM;
	const fontId = isOrgFontId(dto.fontId) ? dto.fontId : "brand";

	if (dto.mode === "preset" && dto.presetId && isOrgPresetId(dto.presetId)) {
		return { mode: "preset", presetId: dto.presetId, fontId };
	}

	if (
		dto.mode === "custom" &&
		dto.colorPrimary &&
		dto.colorAccent &&
		dto.colorSurface &&
		dto.colorInk
	) {
		return {
			mode: "custom",
			colorPrimary: dto.colorPrimary,
			colorAccent: dto.colorAccent,
			colorSurface: dto.colorSurface,
			colorInk: dto.colorInk,
			fontId,
		};
	}

	return { ...DEFAULT_THEME_FORM, fontId };
}
