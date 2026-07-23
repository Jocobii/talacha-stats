import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
	getPublicOrganization,
	getLeagueSnapshot,
	getOrgTopScorers,
	getOrgMatchesToday,
} from "@/entities/organization";
import { getOrgTheme } from "@/features/org-theming";
import { OrgHomeSearch } from "@/features/org-home-search";
import { Inline, Stack } from "@/shared/ui/layout";
import { OrgWallOfFame } from "./OrgWallOfFame";
import { OrgTodaysMatches } from "./OrgTodaysMatches";
import { OrgLeaguesGrid, type OrgLeaguesGridLeague } from "./OrgLeaguesGrid";
import TrialWarning from "./[leagueSlug]/TrialWarning";
import { isAppLocale } from "@/shared/i18n/config";
import { buildOrgLocaleAlternates, ogLocale } from "@/shared/i18n/seo";

type Props = { params: Promise<{ slug: string; locale: string }> };

/** Mismo criterio que OrgPublicShell.buildNav: con 1 liga, el ranking
 * agregado y el de esa liga son lo mismo; con varias, va al agregado. */
function resolveRankingHref(leagues: { slug: string | null }[]): string {
	if (leagues.length === 1 && leagues[0].slug) return `/${leagues[0].slug}?tab=tabla`;
	return "/ranking";
}

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
	// Canónica = subdominio, no /org/{slug} (docs/SUBDOMINIOS-MULTITENANT.md §5).
	const alternates = buildOrgLocaleAlternates(appLocale, slug, "/");

	return {
		title: `${org.name} — TalachaStats`,
		description,
		alternates,
		openGraph: {
			title: `${org.name} — TalachaStats`,
			description,
			url: alternates.canonical,
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

/** Arma los items del directorio (Zona 3) a partir de la liga + su snapshot
 * (misma posición de índice, ambos derivados de `org.leagues`). */
function toLeaguesGridItems(
	leagues: { slug: string | null; name: string; teams: unknown[] }[],
	snapshots: { lastJornada: number | null }[],
): OrgLeaguesGridLeague[] {
	return leagues.map((l, i) => ({
		slug: l.slug ?? "",
		name: l.name,
		jornada: snapshots[i].lastJornada,
		teamsCount: l.teams.length,
	}));
}

export default async function OrgPublicPage({ params }: Props) {
	const { slug, locale } = await params;
	setRequestLocale(locale);
	const t = await getTranslations("org");
	const org = await getPublicOrganization(slug);
	if (!org) notFound();

	const [snapshots, topScorers, matchesToday] = await Promise.all([
		Promise.all(org.leagues.map((l) => getLeagueSnapshot(l.id))),
		getOrgTopScorers(org.id),
		getOrgMatchesToday(org.id),
	]);

	const rankingHref = resolveRankingHref(org.leagues);

	return (
		<div className="px-5 sm:px-7 py-7 pb-16">
			<div className="max-w-4xl mx-auto flex flex-col gap-8">
				{org.status === "trial" && <TrialWarning org={org} />}

				{/* Zona 1 — Hero Search */}
				<Inline justify="center">
					<OrgHomeSearch
						orgSlug={slug}
						labels={{
							placeholder: t("home.searchPlaceholder"),
							minChars: t("home.searchMinChars"),
							noResults: t("home.searchNoResults"),
							loading: t("home.searchLoading"),
						}}
					/>
				</Inline>

				{/* Zona 2 — Valor y Ego */}
				<div className="grid gap-6 md:grid-cols-2">
					<OrgWallOfFame
						scorers={topScorers}
						rankingHref={rankingHref}
						labels={{
							title: t("home.wallOfFame"),
							topScorersLink: t("home.topScorersLink"),
							cta: t("home.wallOfFameCta"),
							ctaLink: t("home.wallOfFameCtaLink"),
							empty: t("home.noScorers"),
						}}
					/>
					<OrgTodaysMatches
						matches={matchesToday}
						labels={{
							title: t("home.playingToday"),
							vs: t("home.vs"),
							empty: t("home.noMatchesToday"),
							countLabel: t("home.todaysMatchesCount", { count: matchesToday.length }),
						}}
					/>
				</div>

				{/* Zona 3 — Directorio */}
				<Stack gap="none" as="section" id="ligas" className="scroll-mt-6">
					<OrgLeaguesGrid
						leagues={toLeaguesGridItems(org.leagues, snapshots)}
						labels={{
							title: t("home.activeLeagues"),
							matchdayWord: t("home.matchdayWord"),
							teamsWord: t("home.teamsWord"),
							viewTable: t("home.viewTable"),
							empty: t("noActiveLeagues"),
						}}
					/>
				</Stack>
			</div>
		</div>
	);
}
