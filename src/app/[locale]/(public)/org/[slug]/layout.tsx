/**
 * Layout del "sitio" público de una organización (docs/ORG-THEMING.md §5,
 * docs/SUBDOMINIOS-MULTITENANT.md §4).
 *
 * Aquí ocurre el cambio de contexto: todo lo que viva bajo /org/[slug]
 * (hub, ligas, tabla, jornadas) se pinta con la identidad visual de la org
 * Y comparte el mismo nav/footer público — es "el mundo de la org".
 * Sin tema configurado, OrgThemeScope es transparente y la paleta
 * TalachaStats aplica como siempre.
 *
 * Cuando el subdominio llegue (miliga.talachastats.com → rewrite interno a
 * /org/miliga, ver proxy.ts), este layout ya sirve tema + nav sin cambios.
 *
 * Si la org no existe, no truena: cada page.tsx bajo este árbol ya llama
 * notFound() con su propio getPublicOrganization (cache() de React dedupea
 * la consulta entre este layout y esa page — no hay doble query a DB).
 * Aquí simplemente no se pinta nav/footer si `org` sale null.
 */

import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { getOrgTheme, OrgThemeScope } from "@/features/org-theming";
import { getPublicOrganization } from "@/entities/organization";
import { getApexUrl } from "@/shared/tenant/apex-url";
import OrgPublicShell, { type OrgShellLabels } from "./OrgPublicShell";

type OrgLayoutProps = {
	params: Promise<{ slug: string; locale: string }>;
	children: ReactNode;
};

export default async function OrgLayout({ params, children }: OrgLayoutProps) {
	const { slug, locale } = await params;
	const [theme, org, t, viewCityLeaguesHref] = await Promise.all([
		getOrgTheme(slug),
		getPublicOrganization(slug),
		getTranslations({ locale, namespace: "org" }),
		getApexUrl("/ligas"),
	]);

	// Textos del shell (Client Component) resueltos en el server: i18n cruza la
	// frontera como props, nunca via hooks del cliente.
	const labels: OrgShellLabels = {
		nav: {
			home: t("nav.home"),
			ligas: t("nav.ligas"),
			ranking: t("nav.ranking"),
			jornadas: t("nav.jornadas"),
			analisis: t("nav.analisis"),
			reglamento: t("nav.reglamento"),
		},
		soon: t("nav.soon"),
		viewCityLeagues: t("nav.viewCityLeagues"),
		poweredBy: t("nav.poweredBy"),
	};

	return (
		<OrgThemeScope tokens={theme?.tokens ?? null} fontId={theme?.fontId}>
			{org ? (
				<OrgPublicShell
					org={{
						slug: org.slug,
						name: org.name,
						logoUrl: org.logoUrl,
						city: org.city,
						leagues: org.leagues
							.filter((league): league is typeof league & { slug: string } => league.slug !== null)
							.map((league) => ({ slug: league.slug, name: league.name })),
					}}
					labels={labels}
					viewCityLeaguesHref={viewCityLeaguesHref}
				>
					{children}
				</OrgPublicShell>
			) : (
				children
			)}
		</OrgThemeScope>
	);
}
