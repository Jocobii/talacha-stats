/**
 * org/[slug]/ranking/page.tsx
 *
 * Goleo agregado de la org — TODAS sus ligas combinadas (docs/
 * SUBDOMINIOS-MULTITENANT.md §3, §9.4). Propuesta simple V1 (decidida con
 * Jocobi): lista plana ordenada por goles, sin podio/tabs/paginación/búsqueda
 * — eso es lo que tiene /ranking en el apex, mucho más elaborado.
 *
 * Reutiliza getOrgRanking (entities/player/ranking, extraído de
 * getCityRanking) — mismo cálculo de goles + deltas, solo cambia el
 * conjunto de leagueIds (los de esta org en vez de los de una ciudad).
 *
 * OrgPublicShell.tsx tiene el nav "Ranking" deshabilitado ("Pronto") para
 * orgs con más de una liga porque hasta ahora no existía este agregado —
 * esta página es justo lo que lo desbloquea (ver ese archivo).
 */

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getPublicOrganization } from "@/entities/organization";
import { getOrgRanking } from "@/entities/player/ranking";
import { titleCase } from "@/shared/lib/normalize";
import { isAppLocale } from "@/shared/i18n/config";
import { buildLocaleAlternates } from "@/shared/i18n/seo";

const TOP_N = 50;

type Props = { params: Promise<{ slug: string; locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { slug, locale } = await params;
	const t = await getTranslations({ locale, namespace: "org" });
	const appLocale = isAppLocale(locale) ? locale : "es";
	const org = await getPublicOrganization(slug);
	if (!org) return { title: t("notFound") };

	const title = t("ranking.title", { orgName: titleCase(org.name) });
	return {
		title: `${title} — TalachaStats`,
		alternates: buildLocaleAlternates(appLocale, `/org/${slug}/ranking`),
	};
}

export default async function OrgRankingPage({ params }: Props) {
	const { slug, locale } = await params;
	setRequestLocale(locale);
	const t = await getTranslations("org");
	const org = await getPublicOrganization(slug);
	if (!org) notFound();

	const { items: ranking } = await getOrgRanking(
		org.leagues.map((l) => l.id),
		{ page: 1, limit: TOP_N },
	);

	return (
		<div className="px-5 sm:px-7 py-7 pb-16">
			<div className="max-w-2xl mx-auto flex flex-col gap-5">
				<div>
					<h1 className="font-display font-black text-2xl text-ink uppercase tracking-tight">
						{t("ranking.title", { orgName: titleCase(org.name) })}
					</h1>
					<p className="text-sm text-ink-3 mt-1">{t("ranking.subtitle", { count: ranking.length })}</p>
				</div>

				{ranking.length === 0 ? (
					<div className="bg-surface-2 border border-line rounded-2xl p-8 text-center text-ink-3 text-sm">
						{t("ranking.empty")}
					</div>
				) : (
					<div className="bg-surface-2 border border-line rounded-2xl overflow-hidden">
						{ranking.map((entry, idx) => (
							<div
								key={entry.playerId}
								className="flex items-center gap-3 px-4 py-3 border-b border-line last:border-0"
							>
								<span className="w-6 text-center shrink-0 font-display font-black text-sm text-ink-3">
									{idx + 1}
								</span>
								<div className="w-9 h-9 rounded-full bg-brand flex items-center justify-center text-pitch font-display font-black text-sm shrink-0">
									{(entry.alias ?? entry.fullName).charAt(0).toUpperCase()}
								</div>
								<div className="flex-1 min-w-0">
									<p className="text-sm font-semibold text-ink truncate">
										{entry.alias ? `"${titleCase(entry.alias)}"` : titleCase(entry.fullName)}
									</p>
									<p className="text-xs text-ink-3 truncate">
										{titleCase(entry.topTeam)} · {titleCase(entry.topLeague)}
										{entry.leaguesCount > 1 && (
											<span className="ml-1 text-brand-ink font-medium">
												{t("ranking.leaguesSuffix", { count: entry.leaguesCount - 1 })}
											</span>
										)}
									</p>
								</div>
								<div className="text-right shrink-0">
									<p className="font-display font-black text-xl text-brand-ink leading-none">
										{entry.totalGoals}
									</p>
									<p className="text-[10px] text-ink-3">{t("ranking.goals")}</p>
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
