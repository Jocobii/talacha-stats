import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/shared/i18n/navigation";
import { Building2, Users, ArrowRight, MapPin } from "lucide-react";
import { listOrganizationsPublic } from "@/entities/organization";
import { titleCase } from "@/shared/lib/normalize";

type LigasPageProps = {
	params: Promise<{ locale: string }>;
};

// TODO(i18n step 6): agregar alternates.languages (hreflang) + og:locale.
export async function generateMetadata({ params }: LigasPageProps): Promise<Metadata> {
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: "ligas" });

	return {
		title: t("meta.title"),
		description: t("meta.description"),
	};
}

export default async function LigasPage({ params }: LigasPageProps) {
	const { locale } = await params;
	setRequestLocale(locale);
	const t = await getTranslations("ligas");

	const orgs = await listOrganizationsPublic();
	const orgsWithLeagues = orgs.filter((o) => o.leagues.length > 0);
	const totalLeagues = orgsWithLeagues.reduce((acc, o) => acc + o.leagues.length, 0);

	return (
		<div className="text-ink flex flex-col flex-1 bg-pitch">
			{/* ── Header ── */}
			<header className="relative px-5 pt-8 pb-0 max-w-lg mx-auto w-full overflow-hidden">
				<div className="absolute inset-0 pointer-events-none" aria-hidden="true">
					<svg
						className="absolute inset-0 w-full h-full"
						xmlns="http://www.w3.org/2000/svg"
						preserveAspectRatio="xMidYMid slice"
					>
						<circle
							cx="88%"
							cy="50%"
							r="80"
							fill="none"
							stroke="#00E676"
							strokeWidth="1"
							opacity="0.07"
						/>
						<circle
							cx="88%"
							cy="50%"
							r="40"
							fill="none"
							stroke="#00E676"
							strokeWidth="0.8"
							opacity="0.05"
						/>
					</svg>
					<div
						style={{
							position: "absolute",
							top: "-30%",
							right: "-15%",
							width: "55%",
							height: "160%",
							background:
								"radial-gradient(ellipse at center, rgba(0,230,118,0.07) 0%, transparent 65%)",
						}}
					/>
				</div>

				<div className="relative z-10 pb-6">
					<div className="flex items-center gap-2 mb-1">
						<Building2 size={24} className="text-brand-ink" strokeWidth={2} />
						<h1 className="font-display font-black text-4xl uppercase tracking-wide leading-none">
							{t("title")}
						</h1>
					</div>
					<p className="text-ink-2 text-sm mt-1">
						{t("activeLeagues", { count: totalLeagues })}
						{" · "}
						{t("organizations", { count: orgsWithLeagues.length })}
					</p>
				</div>
			</header>

			{/* ── Contenido ── */}
			<div className="flex-1 bg-surface rounded-t-3xl px-4 pt-5 pb-16">
				<div className="max-w-lg mx-auto space-y-4">
					{orgsWithLeagues.length === 0 ? (
						<div className="bg-surface-2 border border-line rounded-2xl p-8 text-center text-ink-3 text-sm">
							{t("empty")}
						</div>
					) : (
						orgsWithLeagues.map((org) => <OrgCard key={org.id} org={org} />)
					)}
				</div>
			</div>
		</div>
	);
}

// ── Org card ──────────────────────────────────────────────────────────────────

type OrgWithLeagues = Awaited<ReturnType<typeof listOrganizationsPublic>>[number];

async function OrgCard({ org }: { org: OrgWithLeagues }) {
	const t = await getTranslations("ligas");
	const totalTeams = org.leagues.reduce((acc, l) => acc + l.teams.length, 0);

	return (
		<Link
			href={`/org/${org.slug}`}
			className="block bg-surface-2 border border-line rounded-2xl p-4 hover:border-brand/40 transition-colors group"
		>
			{/* Header de la org */}
			<div className="flex items-center gap-3 mb-3">
				{org.logoUrl ? (
					// eslint-disable-next-line @next/next/no-img-element
					<img
						src={org.logoUrl}
						alt={org.name}
						className="w-12 h-12 rounded-xl object-cover shrink-0 border border-line"
					/>
				) : (
					<div className="w-12 h-12 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center shrink-0">
						<span className="font-display font-black text-xl text-brand-ink">
							{org.name.charAt(0).toUpperCase()}
						</span>
					</div>
				)}
				<div className="flex-1 min-w-0">
					<h2 className="font-display font-black text-lg text-ink uppercase tracking-tight leading-tight truncate group-hover:text-brand-ink transition-colors">
						{titleCase(org.name)}
					</h2>
					<div className="flex items-center gap-1 mt-0.5">
						<MapPin size={12} strokeWidth={2} className="text-ink-3 shrink-0" />
						<span className="text-xs text-ink-3">{org.city}</span>
						<span className="text-ink-3 mx-1">·</span>
						<Users size={12} strokeWidth={2} className="text-ink-3 shrink-0" />
						<span className="text-xs text-ink-3">{t("teams", { count: totalTeams })}</span>
					</div>
				</div>
				<ArrowRight
					size={16}
					strokeWidth={2}
					className="text-ink-3 group-hover:text-brand-ink transition-colors shrink-0"
				/>
			</div>

			{/* Lista de ligas */}
			<div className="space-y-1.5 pl-0">
				{org.leagues.map((league) => (
					<div
						key={league.id}
						className="flex items-center justify-between bg-surface border border-line rounded-xl px-3 py-2"
					>
						<div className="flex items-center gap-2 min-w-0">
							<div className="w-1.5 h-1.5 rounded-full bg-brand shrink-0" />
							<span className="text-sm font-semibold text-ink truncate">
								{titleCase(league.name)}
							</span>
							<span className="text-xs text-ink-3 shrink-0 hidden xs:block">· {league.season}</span>
						</div>
						<span className="text-xs text-ink-3 shrink-0 ml-2">
							{t("teams", { count: league.teams.length })}
						</span>
					</div>
				))}
			</div>
		</Link>
	);
}
