import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CalendarDays } from "lucide-react";
import {
	getPublicOrganization,
	getLeagueSnapshot,
	getOrgHubStats,
	getOrgUpcomingMatches,
	getOrgRecentResults,
} from "@/entities/organization";
import { getOrgTheme } from "@/features/org-theming";
import OrgHomeHero from "./OrgHomeHero";
import OrgStatCard from "./OrgStatCard";
import OrgLeagueCard from "./OrgLeagueCard";
import OrgMatchFeed from "./OrgMatchFeed";
import TrialWarning from "./[leagueSlug]/TrialWarning";
import { isAppLocale } from "@/shared/i18n/config";
import { buildLocaleAlternates, ogLocale } from "@/shared/i18n/seo";

type Props = { params: Promise<{ slug: string; locale: string }> };

// Puntos de color por liga — decorativos (diferencian ligas visualmente), no
// salen del tema. Se ciclan por índice.
const LEAGUE_DOTS = ["#ec1f7a", "#60a5fa", "#fbbf24", "#a78bfa", "#34d399", "#f472b6"];

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { slug, locale } = await params;
	const t = await getTranslations({ locale, namespace: "org" });
	const appLocale = isAppLocale(locale) ? locale : "es";
	const org = await getPublicOrganization(slug);
	if (!org) return { title: t("notFound") };

	const totalTeams = org.leagues.reduce((acc, l) => acc + l.teams.length, 0);
	const description = `Hub de ${org.name} en TalachaStats. ${org.leagues.length} liga${org.leagues.length !== 1 ? "s" : ""} activa${org.leagues.length !== 1 ? "s" : ""} en ${org.city}.`;

	const ogParams = new URLSearchParams({
		title: org.name,
		sub: `${org.city} · ${org.leagues.length} liga${org.leagues.length !== 1 ? "s" : ""}`,
		s1l: "Ligas",
		s1v: String(org.leagues.length),
		s2l: "Equipos",
		s2v: String(totalTeams),
	});

	// Tema de la org → el OG sale con sus colores (/api/og es edge, sin DB:
	// el tema viaja por params y se deriva allá con buildThemeTokens)
	const theme = await getOrgTheme(slug);
	if (theme) {
		ogParams.set("tp", theme.input.primary);
		ogParams.set("ta", theme.input.accent);
		ogParams.set("ts", theme.input.surface);
		ogParams.set("ti", theme.input.ink);
	}

	const ogImageUrl = `/api/og?${ogParams.toString()}`;

	return {
		title: `${org.name} — TalachaStats`,
		description,
		alternates: buildLocaleAlternates(appLocale, `/org/${slug}`),
		openGraph: {
			title: `${org.name} — TalachaStats`,
			description,
			images: [{ url: ogImageUrl, width: 1200, height: 630, alt: org.name }],
			type: "website",
			locale: ogLocale(appLocale),
		},
		twitter: {
			card: "summary_large_image",
			title: `${org.name} — TalachaStats`,
			description,
			images: [ogImageUrl],
		},
	};
}

export default async function OrgPublicPage({ params }: Props) {
	const { slug, locale } = await params;
	setRequestLocale(locale);
	const t = await getTranslations("org");
	const org = await getPublicOrganization(slug);
	if (!org) notFound();

	const totalTeams = org.leagues.reduce((acc, l) => acc + l.teams.length, 0);

	const [hubStats, snapshots, upcoming, recent] = await Promise.all([
		getOrgHubStats(org.id),
		Promise.all(org.leagues.map((l) => getLeagueSnapshot(l.id))),
		getOrgUpcomingMatches(org.id),
		getOrgRecentResults(org.id),
	]);

	const jornadaValue = hubStats.lastJornada != null ? `J${hubStats.lastJornada}` : "—";

	return (
		<div className="px-5 sm:px-7 py-7 pb-16">
			<div className="max-w-4xl mx-auto flex flex-col gap-8">
				<OrgHomeHero
					name={org.name}
					city={org.city}
					logoUrl={org.logoUrl ?? null}
					leaguesLabel={t("hero.leagues", { count: org.leagues.length })}
					teamsLabel={t("hero.teams", { count: totalTeams })}
				/>

				{org.status === "trial" && <TrialWarning org={org} />}

				{/* Trío de stats */}
				<div className="flex gap-3.5 flex-wrap">
					<OrgStatCard value={hubStats.totalGoals} label={t("home.statGoals")} accent />
					<OrgStatCard value={totalTeams} label={t("home.statTeams")} />
					<OrgStatCard value={jornadaValue} label={t("home.statMatchday")} />
				</div>

				{/* Ligas destacadas */}
				{org.leagues.length === 0 ? (
					<p className="text-sm text-ink-3 text-center py-6">{t("noActiveLeagues")}</p>
				) : (
					<section id="ligas" className="scroll-mt-6">
						<h2 className="font-display font-extrabold text-lg text-ink tracking-tight mb-3.5">
							{t("home.featuredLeagues")}
						</h2>
						<div
							className="grid gap-3.5"
							style={{ gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))" }}
						>
							{org.leagues.map((l, i) => (
								<OrgLeagueCard
									key={l.id}
									slug={l.slug ?? ""}
									name={l.name}
									season={l.season}
									teamsCount={l.teams.length}
									jornada={snapshots[i].lastJornada}
									dotColor={LEAGUE_DOTS[i % LEAGUE_DOTS.length]}
									inCourseLabel={t("home.inCourse")}
									viewLabel={t("home.viewTableScorers")}
									teamsWord={t("home.teamsWord")}
									matchdayWord={t("home.matchdayWord")}
								/>
							))}
						</div>
					</section>
				)}

				{/* Próxima jornada + Partidos recientes */}
				<div className="grid gap-5 md:grid-cols-2">
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
		</div>
	);
}
