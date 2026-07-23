"use client";

/**
 * OrgPublicShell.tsx
 *
 * Shell del "sitio" público de una organización (docs/SUBDOMINIOS-MULTITENANT.md
 * §4, docs/ORG-THEMING.md §5). Vive en org/[slug]/layout.tsx, así que envuelve
 * TODO el subárbol (home, liga, tabs).
 *
 * Rediseño (jul 2026): header tipo mockup "Org Subdomain Home" — logo+nombre
 * a la izquierda, nav horizontal en desktop, dropdown mobile bajo el header.
 * Reemplaza el shell anterior (sidebar de escritorio + topbar de chips de
 * ligas): el mockup no tiene chips ni sidebar persistente, solo header + nav.
 *
 * Client Component: necesita usePathname() para el estado activo y estado
 * local para el menú mobile. Los datos scoped y los textos (i18n) llegan como
 * props desde el layout (server).
 */

import { ReactNode, useState } from "react";
import { usePathname } from "@/shared/i18n/navigation";
import { buildOrgNav, resolveActiveNavId } from "./org-nav";
import { OrgShellHeader } from "./OrgShellHeader";
import { OrgShellMobileMenu } from "./OrgShellMobileMenu";
import { OrgShellFooter } from "./OrgShellFooter";

export type OrgShellLabels = {
	nav: {
		home: string;
		ligas: string;
		ranking: string;
		jornadas: string;
		analisis: string;
		reglamento: string;
	};
	soon: string;
	viewCityLeagues: string;
	poweredBy: string;
};

type OrgShellData = {
	slug: string;
	name: string;
	logoUrl: string | null;
	city: string;
	leagues: { slug: string; name: string }[];
};

export default function OrgPublicShell({
	org,
	labels,
	viewCityLeaguesHref,
	children,
}: {
	org: OrgShellData;
	labels: OrgShellLabels;
	viewCityLeaguesHref: string;
	children: ReactNode;
}) {
	const pathname = usePathname();
	const [mobileOpen, setMobileOpen] = useState(false);

	const nav = buildOrgNav(org.leagues, labels.nav);
	const activeId = resolveActiveNavId(pathname);

	// Cerrar el menú al navegar: en el onClick de cada link, no en un efecto
	// sobre pathname (sin setState dentro de useEffect, AGENTS.md §7.2).
	const closeMenu = () => setMobileOpen(false);

	return (
		<div className="min-h-screen flex flex-col bg-pitch text-ink">
			<OrgShellHeader
				org={org}
				nav={nav}
				activeId={activeId}
				soonLabel={labels.soon}
				mobileOpen={mobileOpen}
				onToggleMobile={() => setMobileOpen((v) => !v)}
			/>

			{mobileOpen && (
				<OrgShellMobileMenu
					nav={nav}
					activeId={activeId}
					soonLabel={labels.soon}
					onNavigate={closeMenu}
				/>
			)}

			<main className="flex-1 w-full overflow-x-hidden">{children}</main>

			<OrgShellFooter
				orgName={org.name}
				viewCityLeaguesHref={viewCityLeaguesHref}
				viewCityLeaguesLabel={labels.viewCityLeagues}
				poweredByLabel={labels.poweredBy}
			/>
		</div>
	);
}
