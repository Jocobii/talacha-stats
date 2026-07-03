/**
 * features/org-theming — tema visual por organización (docs/ORG-THEMING.md).
 * Las capas superiores importan SOLO desde aquí.
 */

export { getOrgTheme, type ResolvedOrgTheme } from "./get-org-theme";
export { OrgThemeScope } from "./ui/OrgThemeScope";
export { resolveThemeInput, type OrgThemeRow } from "./lib/resolve-theme-input";
