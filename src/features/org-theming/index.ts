/**
 * features/org-theming — tema visual por organización (docs/ORG-THEMING.md).
 * Las capas superiores importan SOLO desde aquí.
 */

export { getOrgTheme, type ResolvedOrgTheme } from "./get-org-theme";
export { getOrgImagePalette } from "./get-org-image-palette";
export { OrgThemeScope } from "./ui/OrgThemeScope";
export { OrgThemePanel } from "./ui/OrgThemePanel";
// Nota: los Client Components deben importar OrgStyleStep por su ruta profunda
// (./ui/OrgStyleStep), no por este barrel — reexporta getOrgTheme (server/@/db).
export { OrgStyleStep, DEFAULT_ORG_STYLE, type OrgStyleValue } from "./ui/OrgStyleStep";
export { resolveThemeInput, type OrgThemeRow } from "./lib/resolve-theme-input";
export {
	themeFormToRowValues,
	dtoToThemeForm,
	DEFAULT_THEME_FORM,
	type ThemeRowValues,
} from "./lib/map-theme-form";
export { ThemeFormSchema, type ThemeFormInput } from "./model/theme-form-schema";
export type { OrgThemeDto } from "./types";
