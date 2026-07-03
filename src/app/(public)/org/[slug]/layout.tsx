/**
 * Layout del "sitio" público de una organización (docs/ORG-THEMING.md §5).
 *
 * Aquí ocurre el cambio de contexto: todo lo que viva bajo /org/[slug]
 * (hub, ligas, tabla, jornadas) se pinta con la identidad visual de la org.
 * Sin tema configurado, OrgThemeScope es transparente y la paleta
 * TalachaStats aplica como siempre.
 *
 * Cuando lleguen los subdominios (novofut.talachastats.com → rewrite a
 * /org/novofut), este layout ya sirve el tema sin cambios.
 */

import type { ReactNode } from "react";
import { getOrgTheme, OrgThemeScope } from "@/features/org-theming";

type OrgLayoutProps = {
	params: Promise<{ slug: string }>;
	children: ReactNode;
};

export default async function OrgLayout({ params, children }: OrgLayoutProps) {
	const { slug } = await params;
	const theme = await getOrgTheme(slug);

	return (
		<OrgThemeScope tokens={theme?.tokens ?? null} fontId={theme?.fontId}>
			{children}
		</OrgThemeScope>
	);
}
