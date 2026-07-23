/**
 * org/[slug]/jornadas/page.tsx
 *
 * Próximos partidos + resultados recientes de TODAS las ligas de la org
 * (docs/SUBDOMINIOS-MULTITENANT.md §3, §9.4) — versión completa del teaser
 * que ya vive en el home (OrgMatchFeed con límite 6). Reutiliza
 * getOrgUpcomingMatches/getOrgRecentResults (entities/organization) y el
 * mismo componente de presentación — cero código nuevo de datos, solo un
 * límite más alto y su propia página.
 *
 * Desbloquea el nav "Jornadas" en OrgPublicShell.tsx para orgs multi-liga
 * (antes "Pronto" — ver el comentario de buildNav ahí).
 */

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CalendarDays } from "lucide-react";
import { getPublicOrganization, getOrgUpcomingMatches, getOrgRecentResults } from "@/entities/organization";
import OrgMatchFeed from "../OrgMatchFeed";
import { titleCase } from "@/shared/lib/normalize";
import { isAppLocale } from "@/shared/i18n/config";
import { buildOrgLocaleAlternates } from "@/shared/i18n/seo";

const FEED_LIMIT = 30;

type Props = { params: Promise<{ slug: string; locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { slug, locale } = await params;
	const t = await getTranslations({ locale, namespace: "org" });
	const appLocale = isAppLocale(locale) ? locale : "es";
	const org = await getPublicOrganization(slug);
	if (!org) return { title: t("notFound") };

	// Canónica = subdominio, no /org/{slug}/jornadas (docs/SUBDOMINIOS-MULTITENANT.md §5).
	return {
		title: `${t("jornadas.title", { orgName: titleCase(org.name) })} — TalachaStats`,
		alternates: buildOrgLocaleAlternates(appLocale, slug, "/jornadas"),
	};
}

export default async function OrgJornadasPage({ params }: Props) {
	const { slug, locale } = await params;
	setRequestLocale(locale);
	const t = await getTranslations("org");
	const org = await getPublicOrganization(slug);
	if (!org) notFound();

	const [upcoming, recent] = await Promise.all([
		getOrgUpcomingMatches(org.id, FEED_LIMIT),
		getOrgRecentResults(org.id, FEED_LIMIT),
	]);

	return (
		<div className="px-5 sm:px-7 py-7 pb-16">
			<div className="max-w-2xl mx-auto flex flex-col gap-6">
				<div>
					<h1 className="font-display font-black text-2xl text-ink uppercase tracking-tight">
						{t("jornadas.title", { orgName: titleCase(org.name) })}
					</h1>
					<p className="text-sm text-ink-3 mt-1">{t("jornadas.subtitle")}</p>
				</div>

				<section>
					<h2 className="flex items-center gap-2 font-display font-extrabold text-lg text-ink tracking-tight mb-3.5">
						<CalendarDays size={16} strokeWidth={2} className="text-brand-ink" />
						{t("home.nextMatchday")}
					</h2>
					<OrgMatchFeed
						variant="upcoming"
						matches={upcoming}
						vsWord={t("home.vs")}
						emptyLabel={t("home.noUpcoming")}
					/>
				</section>

				<section>
					<h2 className="font-display font-extrabold text-lg text-ink tracking-tight mb-3.5">
						{t("home.recentMatches")}
					</h2>
					<OrgMatchFeed
						variant="recent"
						matches={recent}
						vsWord={t("home.vs")}
						emptyLabel={t("home.noRecent")}
					/>
				</section>
			</div>
		</div>
	);
}
