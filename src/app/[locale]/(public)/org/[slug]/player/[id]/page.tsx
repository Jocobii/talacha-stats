/**
 * org/[slug]/player/[id]/page.tsx
 *
 * Perfil de jugador SCOPED a esta org (docs/SUBDOMINIOS-MULTITENANT.md §3,
 * §9.5 — alcance ya decidido por Jocobi: "solo esta org en el subdominio").
 * El jugador global (`global_players`, identidad CURP) puede jugar en varias
 * orgs; aquí solo se muestran sus números EN LAS LIGAS DE ESTA ORG — nada de
 * comparativos de ciudad ni badges (eso es inherentemente cross-org/ciudad,
 * vive solo en el perfil global del apex, /player/[id]).
 *
 * Reutiliza getPlayerProfileForLeagues (entities/player) — misma fuente de
 * stats que el perfil global, sin duplicar la lógica de merge Excel/vivo.
 * Vista propia (no PlayerEditorialProfile): esa depende de ranking de
 * ciudad/achievements que no aplican aquí.
 */

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getPublicOrganization } from "@/entities/organization";
import { getPlayerProfileForLeagues } from "@/entities/player";
import { titleCase } from "@/shared/lib/normalize";
import { isAppLocale } from "@/shared/i18n/config";
import { buildLocaleAlternates, ogLocale } from "@/shared/i18n/seo";
import { getApexUrl } from "@/shared/tenant/apex-url";

type Props = { params: Promise<{ slug: string; id: string; locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { slug, id, locale } = await params;
	const t = await getTranslations({ locale, namespace: "player" });
	const appLocale = isAppLocale(locale) ? locale : "es";
	const org = await getPublicOrganization(slug);
	if (!org) return { title: t("notFound") };

	const profile = await getPlayerProfileForLeagues(
		id,
		org.leagues.map((l) => l.id),
	);
	if (!profile) return { title: t("notFound") };

	const name = profile.alias ? `${profile.fullName} "${profile.alias}"` : profile.fullName;
	const title = t("orgScoped.title", { orgName: titleCase(org.name) });

	// Canonical apunta al perfil global (apex): es el mismo contenido base,
	// no queremos que el buscador indexe dos versiones del mismo jugador.
	return {
		title: `${name} — ${title}`,
		alternates: { canonical: buildLocaleAlternates(appLocale, `/player/${id}`).canonical },
		openGraph: { title: name, description: title, type: "profile", locale: ogLocale(appLocale) },
	};
}

export default async function OrgScopedPlayerPage({ params }: Props) {
	const { slug, id, locale } = await params;
	setRequestLocale(locale);
	const t = await getTranslations("player");
	const org = await getPublicOrganization(slug);
	if (!org) notFound();

	const profile = await getPlayerProfileForLeagues(
		id,
		org.leagues.map((l) => l.id),
	);
	if (!profile) notFound();

	const { global: g } = profile;
	const displayName = profile.alias ? `"${titleCase(profile.alias)}"` : titleCase(profile.fullName);
	const globalProfileHref = await getApexUrl(`/player/${id}`);

	return (
		<div className="max-w-lg mx-auto w-full px-4 py-8 flex flex-col gap-5">
			<div>
				<p className="text-xs font-bold text-ink-3 uppercase tracking-widest mb-1">
					{t("orgScoped.title", { orgName: titleCase(org.name) })}
				</p>
				<h1 className="font-display font-black text-2xl sm:text-3xl text-ink leading-tight uppercase">
					{titleCase(profile.fullName)}
				</h1>
				{profile.alias && <p className="text-brand-ink text-sm font-semibold mt-1">{displayName}</p>}
			</div>

			{/* Totales en esta org */}
			<div className="grid grid-cols-3 gap-2">
				<StatBox value={g.totalGoals} label={t("secondary.goals")} />
				<StatBox value={g.totalAssists} label={t("hero.assists")} />
				<StatBox value={g.totalMatches} label={t("secondary.matches")} />
			</div>

			{/* Stats por liga (solo ligas de esta org) */}
			<div className="bg-surface-2 border border-line rounded-2xl overflow-hidden">
				<div className="px-4 py-2.5 border-b border-line">
					<span className="text-[10px] font-bold text-ink-3 uppercase tracking-widest">
						{t("orgScoped.byLeague")}
					</span>
				</div>
				{profile.leagues.map((league) => (
					<div
						key={league.leagueId}
						className="flex items-center justify-between px-4 py-3 border-b border-line last:border-0"
					>
						<div className="min-w-0">
							<p className="text-sm font-semibold text-ink truncate">{titleCase(league.leagueName)}</p>
							<p className="text-xs text-ink-3 truncate">{titleCase(league.teamName)}</p>
						</div>
						<div className="flex items-center gap-3 shrink-0 text-right">
							<span className="text-sm font-black text-brand-ink">{league.goals}</span>
							<span className="text-xs text-ink-3">{t("secondary.goals")}</span>
						</div>
					</div>
				))}
			</div>

			{/* Puente al perfil global — enlace discreto (§9.5) */}
			{/* eslint-disable-next-line @next/next/no-html-link-for-pages -- absoluto al apex a propósito */}
			<a
				href={globalProfileHref}
				className="text-center text-xs text-ink-3 hover:text-brand-ink transition underline underline-offset-2"
			>
				{t("orgScoped.viewGlobalProfile")}
			</a>
		</div>
	);
}

function StatBox({ value, label }: { value: number; label: string }) {
	return (
		<div className="bg-surface-2 border border-line rounded-xl px-3 py-2.5 text-center">
			<p className="font-display font-black text-xl text-ink">{value}</p>
			<p className="text-[10px] text-ink-3 uppercase tracking-wide">{label}</p>
		</div>
	);
}
