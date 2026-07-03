/**
 * features/org-theming/ui/OrgThemeScope.tsx
 *
 * Frontera visual del tema por organización. Server-safe (sin "use client"):
 * solo emite un wrapper con las CSS vars del tema resueltas en SSR — el HTML
 * llega pintado, no existe un frame sin tema (cero FOUC, cero JS de theming).
 *
 * Sobreescribe el contrato skin (--color-skin-*) Y los tokens base
 * (--color-pitch, --color-ink, --color-brand…), así que TODO lo que renderice
 * adentro — componentes existentes incluidos — adopta la identidad de la org.
 *
 * `display: contents` hace el wrapper neutro para el layout (flex/grid de las
 * páginas no se rompe); las custom properties se heredan igual.
 *
 * Con tokens null no emite nada extra → paleta TalachaStats.
 */

import type { CSSProperties, ReactNode } from "react";
import { tokensToScopeCssVars, type OrgThemeTokens } from "@/shared/org-theme";

type OrgThemeScopeProps = {
	tokens: OrgThemeTokens | null;
	children: ReactNode;
};

export function OrgThemeScope({ tokens, children }: OrgThemeScopeProps) {
	if (!tokens) return <>{children}</>;

	return (
		<div
			data-org-theme=""
			style={{ display: "contents", ...tokensToScopeCssVars(tokens) } as CSSProperties}
		>
			{children}
		</div>
	);
}
