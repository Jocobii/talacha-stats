"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/shared/i18n/navigation";
import { MapPin, Trophy, Shield, Users, ArrowUpRight } from "lucide-react";
import { getRootDomain } from "@/shared/tenant/host";
import { buildUniverseHref } from "../lib/build-universe-href";
import type { OrgDirectoryCardView } from "../types";

/** Card de una organización en el Hub de Portales — diseño en grid o lista. */
export default function OrgDirectoryCard({ org }: { org: OrgDirectoryCardView }) {
	const t = useTranslations("organizaciones");
	const universeHref = useMemo(() => buildUniverseHref(org.slug, getRootDomain()), [org.slug]);

	return (
		<div className="bg-surface-2 border border-line rounded-2xl p-4 hover:border-brand/40 transition-colors group flex flex-col gap-3">
			<Link href={org.href} className="flex items-center gap-3">
				<div
					className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${org.avatarPalette.bg} ${org.avatarPalette.border}`}
				>
					{org.logoUrl ? (
						// eslint-disable-next-line @next/next/no-img-element
						<img
							src={org.logoUrl}
							alt={org.name}
							className="w-full h-full rounded-xl object-cover"
						/>
					) : (
						<span className={`font-display font-black text-lg ${org.avatarPalette.text}`}>
							{org.initial}
						</span>
					)}
				</div>
				<div className="flex-1 min-w-0">
					<h2 className="font-display font-black text-base text-ink uppercase tracking-tight leading-tight truncate group-hover:text-brand-ink transition-colors">
						{org.name}
					</h2>
					<div className="flex items-center gap-1 mt-0.5">
						<MapPin size={11} strokeWidth={2} className="text-ink-3 shrink-0" />
						<span className="text-xs text-ink-3">{org.city}</span>
					</div>
				</div>
				<span className="shrink-0 text-[10px] font-bold uppercase tracking-widest text-brand-ink bg-brand/10 border border-brand/20 rounded-full px-2 py-1">
					{t("statusActive")}
				</span>
			</Link>

			<div className="grid grid-cols-3 gap-2">
				<StatTile
					icon={<Trophy size={12} strokeWidth={2} />}
					value={org.leagueCount}
					label={t("leagues", { count: org.leagueCount })}
				/>
				<StatTile
					icon={<Shield size={12} strokeWidth={2} />}
					value={org.teamCount}
					label={t("teams", { count: org.teamCount })}
				/>
				<StatTile
					icon={<Users size={12} strokeWidth={2} />}
					value={org.playerCount}
					label={t("players", { count: org.playerCount })}
				/>
			</div>

			<div className="flex items-center justify-between gap-2 pt-1">
				<span className="text-[11px] font-mono text-ink-3 truncate">{org.subdomainPreview}</span>
				<a
					href={universeHref}
					className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-ink-2 hover:text-brand-ink border border-line hover:border-brand/40 px-3 py-1.5 rounded-lg transition-colors"
				>
					{t("enterUniverse")}
					<ArrowUpRight size={12} strokeWidth={2} />
				</a>
			</div>
		</div>
	);
}

function StatTile({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
	return (
		<div className="bg-surface border border-line rounded-xl py-2 flex flex-col items-center gap-0.5">
			<div className="flex items-center gap-1 text-ink-3">
				{icon}
				<span className="font-display font-black text-sm text-ink leading-none">{value}</span>
			</div>
			<span className="text-[9px] text-ink-3 uppercase tracking-widest text-center leading-tight px-1">
				{label}
			</span>
		</div>
	);
}
