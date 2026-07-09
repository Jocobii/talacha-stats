/**
 * features/onboarding-wizard/lib/to-org-style-value.ts
 * StyleDraft (types.ts) es un espejo estructural de OrgStyleValue
 * (org-theming) — evita importar el tipo de una feature ajena en el archivo
 * de tipos compartido. Aquí lo angostamos de vuelta a los literales reales
 * con los type guards del catálogo. Compartido entre OnboardingPreviewAside
 * y StepFinale para no duplicarlo (§3.5).
 */

import { isOrgFontId, isOrgPresetId } from "@/shared/org-theme";
import type { OrgStyleValue } from "@/features/org-theming/ui/OrgStyleStep";
import type { StyleDraft } from "../types";

export function toOrgStyleValue(style: StyleDraft): OrgStyleValue {
	return {
		presetId: style.presetId && isOrgPresetId(style.presetId) ? style.presetId : null,
		fontId: isOrgFontId(style.fontId) ? style.fontId : "brand",
	};
}
