"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/shared/i18n/navigation";
import { MapPin, ChevronRight, Users, Star } from "lucide-react";
import { titleCase } from "@/shared/lib/normalize";
import type { LeagueShowcaseItem } from "@/entities/organization";

/* ── Card individual ─────────────────────────────────────────────────────────── */
function LeagueCardItem({
	league,
	delay,
	visible,
}: {
	league: LeagueShowcaseItem;
	delay: number;
	visible: boolean;
}) {
	const t = useTranslations("home");
	const initial = league.name.charAt(0).toUpperCase();

	return (
		<div
			className="bg-surface border border-line rounded-2xl overflow-hidden hover:border-brand/40 transition-colors group"
			style={{
				opacity: visible ? 1 : 0,
				transform: visible ? "translateY(0)" : "translateY(24px)",
				transition: `opacity 0.6s cubic-bezier(0.22,1,0.36,1) ${delay}ms, transform 0.6s cubic-bezier(0.22,1,0.36,1) ${delay}ms, border-color 0.2s`,
			}}
		>
			{/* Header de la liga */}
			<div className="bg-brand/5 border-b border-line px-4 py-3.5 flex items-center gap-3">
				<div className="w-10 h-10 rounded-xl bg-brand/15 border border-brand/25 flex items-center justify-center shrink-0">
					<span className="font-display font-black text-lg text-brand-ink">{initial}</span>
				</div>
				<div className="min-w-0 flex-1">
					<p className="font-display font-black text-base text-ink uppercase tracking-tight leading-tight truncate">
						{league.name}
					</p>
					<div className="flex items-center gap-1 mt-0.5">
						<MapPin size={10} strokeWidth={2} className="text-ink-3 shrink-0" />
						<p className="text-[11px] text-ink-3 truncate">
							{league.city}
							{league.season ? ` · ${league.season}` : ""}
						</p>
					</div>
				</div>
			</div>

			{/* Stats de la liga */}
			<div className="grid grid-cols-2 divide-x divide-line border-b border-line">
				<div className="flex flex-col items-center py-3 gap-0.5">
					<div className="flex items-center gap-1">
						<Users size={10} strokeWidth={2} className="text-ink-3" />
						<span className="font-display font-black text-2xl text-ink leading-none">
							{league.playerCount}
						</span>
					</div>
					<span className="text-[10px] text-ink-3 uppercase tracking-widest font-semibold">
						{t("leaguesShowcase.playersLabel")}
					</span>
				</div>
				<div className="flex flex-col items-center py-3 gap-0.5">
					<span className="font-display font-black text-2xl text-ink leading-none">
						{league.teamCount}
					</span>
					<span className="text-[10px] text-ink-3 uppercase tracking-widest font-semibold">
						{t("leaguesShowcase.teamsLabel")}
					</span>
				</div>
			</div>

			{/* Goleador top */}
			<div className="px-4 py-3 flex items-center gap-2.5">
				<Star size={12} strokeWidth={2} className="text-brand-ink shrink-0" />
				<div className="min-w-0 flex-1">
					<p className="text-[11px] text-ink-3 uppercase tracking-widest font-semibold mb-0.5">
						{t("leaguesShowcase.topScorerLabel")}
					</p>
					{league.topScorer ? (
						<p className="text-sm font-semibold text-ink truncate">
							{league.topScorer.alias ? (
								<>&quot;{titleCase(league.topScorer.alias)}&quot;</>
							) : (
								titleCase(league.topScorer.fullName)
							)}
						</p>
					) : (
						<p className="text-sm text-ink-3 italic truncate">{t("leaguesShowcase.noTopScorer")}</p>
					)}
				</div>
				{league.topScorer && (
					<div className="text-right shrink-0">
						<p className="font-display font-black text-xl text-brand-ink leading-none">
							{league.topScorer.goals}
						</p>
						<p className="text-[10px] text-ink-3">{t("leaguesShowcase.goalsUnit")}</p>
					</div>
				)}
			</div>

			{/* CTA — solo se muestra si hay URL real */}
			{league.orgSlug && league.leagueSlug && (
				<div className="px-4 pb-3.5">
					<Link
						href={`/org/${league.orgSlug}/${league.leagueSlug}`}
						className="flex items-center justify-center gap-1 w-full text-xs font-semibold text-ink-3 group-hover:text-brand-ink border border-line group-hover:border-brand/30 py-2 rounded-xl transition"
					>
						{t("leaguesShowcase.viewLeague")}
						<ChevronRight size={12} strokeWidth={2} />
					</Link>
				</div>
			)}
		</div>
	);
}

/* ── Sección completa ─────────────────────────────────────────────────────────── */
export default function LeaguesShowcase({ leagues }: { leagues: LeagueShowcaseItem[] }) {
	const t = useTranslations("home");
	const [visible, setVisible] = useState(false);
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		const obs = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					setVisible(true);
					obs.disconnect();
				}
			},
			{ threshold: 0.1 },
		);
		obs.observe(el);
		return () => obs.disconnect();
	}, []);

	if (leagues.length === 0) return null;

	return (
		<section className="bg-pitch border-t border-line px-5 py-16">
			<div className="max-w-4xl mx-auto">
				{/* Header */}
				<div
					className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8"
					style={{
						opacity: visible ? 1 : 0,
						transform: visible ? "translateY(0)" : "translateY(16px)",
						transition: "opacity 0.5s ease, transform 0.5s ease",
					}}
				>
					<div>
						<p className="text-[11px] font-bold text-brand-ink uppercase tracking-widest mb-1.5">
							{t("leaguesShowcase.eyebrow")}
						</p>
						<h2 className="font-display font-black text-3xl sm:text-4xl uppercase text-ink leading-tight">
							{t("leaguesShowcase.titleLine1")}
							<br className="sm:hidden" /> {t("leaguesShowcase.titleLine2")}
						</h2>
						<p className="text-ink-2 text-sm mt-2 max-w-sm">{t("leaguesShowcase.subtext")}</p>
					</div>
					<Link
						href="/about#organizadores"
						className="shrink-0 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-ink border border-brand/30 hover:bg-brand/8 px-4 py-2.5 rounded-xl transition"
					>
						{t("leaguesShowcase.cta")}
						<ChevronRight size={14} strokeWidth={2} />
					</Link>
				</div>

				{/* Grid de ligas */}
				<div ref={ref} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
					{leagues.map((league, i) => (
						<LeagueCardItem key={league.id} league={league} delay={i * 100} visible={visible} />
					))}
				</div>
			</div>
		</section>
	);
}
