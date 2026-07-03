/**
 * shared/org-theme — sistema de temas por organización (docs/ORG-THEMING.md).
 * Todo el módulo es PURO y client-safe: sin @/db, sin React.
 */

export { HEX_COLOR_REGEX, isHexColor, mix, withAlpha } from "./color";
export {
	contrastRatio,
	ensureContrast,
	inkOn,
	relativeLuminance,
	INK_DARK,
	INK_LIGHT,
} from "./contrast";
export {
	buildThemeTokens,
	reportThemeContrast,
	type OrgThemeTokens,
	type ThemeContrastReport,
	type ThemeInput,
} from "./build-tokens";
export { tokensToCssBlock, tokensToCssVars, tokensToScopeCssVars } from "./css-vars";
export {
	ORG_PRESETS,
	ORG_PRESET_IDS,
	ORG_PRESET_LIST,
	isOrgPresetId,
	type OrgPresetDefinition,
	type OrgPresetId,
} from "./presets";
export {
	ORG_FONTS,
	ORG_FONT_IDS,
	ORG_FONT_LIST,
	isOrgFontId,
	type OrgFontDefinition,
	type OrgFontId,
} from "./fonts";
export {
	ORG_SLUG_REGEX,
	RESERVED_ORG_SLUGS,
	suggestOrgSlug,
	validateOrgSlug,
	type OrgSlugValidation,
} from "./slug";
