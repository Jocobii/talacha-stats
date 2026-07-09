"use client";

/**
 * app/(public)/org/[slug]/[leagueSlug]/MatchdayPublicView.tsx
 *
 * Vista pública de jornadas: chips de selección + tarjetas de partidos.
 * Solo lectura.
 */

import { useState, useRef } from "react";
import { CalendarDays, Clock, MapPin, AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import type { PublicMatchday } from "@/entities/organization";

type Props = {
	matchdays: PublicMatchday[];
};

function timeAgo(date: Date, t: ReturnType<typeof useTranslations>): string {
	const diffMs = Date.now() - date.getTime();
	const diffH = Math.floor(diffMs / (1000 * 60 * 60));
	if (diffH < 1) return t("matchdayView.timeAgo.lessThanHour");
	if (diffH === 1) return t("matchdayView.timeAgo.oneHour");
	if (diffH < 24) return t("matchdayView.timeAgo.hours", { count: diffH });
	const diffD = Math.floor(diffH / 24);
	if (diffD === 1) return t("matchdayView.timeAgo.oneDay");
	return t("matchdayView.timeAgo.days", { count: diffD });
}

function fmtKickoff(kickoffAt: Date): string {
	return new Date(kickoffAt).toLocaleTimeString("es-MX", {
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	});
}

function teamInitials(name: string): string {
	return name
		.split(/\s+/)
		.filter((w) => w.length > 1)
		.slice(0, 2)
		.map((w) => w[0]!.toUpperCase())
		.join("");
}

function MatchCard({ match }: { match: PublicMatchday["matches"][0] }) {
	const homeInitials = teamInitials(match.homeTeamName);
	const awayInitials = teamInitials(match.awayTeamName);

	return (
		<div className="bg-surface-2 border border-line rounded-xl p-3.5 flex flex-col gap-2.5">
			{/* Teams row */}
			<div className="flex items-center gap-3">
				{/* Home */}
				<div className="flex-1 flex items-center gap-2 min-w-0">
					<span className="w-8 h-8 rounded-lg bg-blue/10 border border-blue/20 flex items-center justify-center font-display font-black text-[11px] text-blue shrink-0">
						{homeInitials}
					</span>
					<span className="text-sm font-semibold text-ink truncate">{match.homeTeamName}</span>
				</div>

				{/* VS */}
				<span className="text-xs font-bold text-ink-3 shrink-0">vs</span>

				{/* Away */}
				<div className="flex-1 flex items-center gap-2 min-w-0 justify-end">
					<span className="text-sm font-semibold text-ink truncate text-right">
						{match.awayTeamName}
					</span>
					<span className="w-8 h-8 rounded-lg bg-rose/10 border border-rose/20 flex items-center justify-center font-display font-black text-[11px] text-rose shrink-0">
						{awayInitials}
					</span>
				</div>
			</div>

			{/* Meta row */}
			{(match.kickoffAt || match.venueName) && (
				<div className="flex items-center gap-3 flex-wrap">
					{match.kickoffAt && (
						<span className="flex items-center gap-1 text-[11px] text-ink-3">
							<Clock size={11} className="shrink-0" />
							{fmtKickoff(new Date(match.kickoffAt))}
						</span>
					)}
					{match.venueName && (
						<span className="flex items-center gap-1 text-[11px] text-ink-3">
							<MapPin size={11} className="shrink-0" />
							{match.venueName}
						</span>
					)}
				</div>
			)}
		</div>
	);
}

function RecentlyUpdatedBanner({ lastConfirmedAt }: { lastConfirmedAt: Date }) {
	const t = useTranslations("org");
	return (
		<div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber/8 border border-amber/20 text-[12px] text-amber">
			<AlertCircle size={13} className="shrink-0" />
			<span>
				{t("matchdayView.updated")}{" "}
				<span className="font-semibold">{timeAgo(lastConfirmedAt, t)}</span>
			</span>
		</div>
	);
}

export default function MatchdayPublicView({ matchdays }: Props) {
	const t = useTranslations("org");
	const [selectedIdx, setSelectedIdx] = useState(0);
	const chipsRef = useRef<HTMLDivElement>(null);

	if (matchdays.length === 0) {
		return (
			<div className="bg-surface-2 border border-line rounded-2xl p-6 text-center text-ink-3 text-sm">
				{t("matchdayView.empty")}
			</div>
		);
	}

	const selected = matchdays[selectedIdx]!;

	return (
		<div className="flex flex-col gap-4">
			{/* Chips de selección */}
			<div
				ref={chipsRef}
				className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide"
				style={{ scrollbarWidth: "none" }}
			>
				{matchdays.map((md, i) => {
					const isActive = i === selectedIdx;
					return (
						<button
							key={md.id}
							onClick={() => setSelectedIdx(i)}
							className={`shrink-0 px-3.5 py-1.5 rounded-full text-[12px] font-semibold transition-colors border ${
								isActive
									? "bg-brand/15 border-brand/40 text-brand-ink"
									: "bg-surface-2 border-line text-ink-3 hover:text-ink hover:border-line"
							}`}
						>
							J{md.number}
						</button>
					);
				})}
			</div>

			{/* Banner de actualización reciente */}
			{selected.recentlyUpdated && selected.lastConfirmedAt && (
				<RecentlyUpdatedBanner lastConfirmedAt={new Date(selected.lastConfirmedAt)} />
			)}

			{/* Fecha y estado de la jornada */}
			<div className="flex items-center gap-2">
				<CalendarDays size={13} className="text-ink-3 shrink-0" />
				<span className="text-[12px] text-ink-3">
					{new Date(selected.scheduledDate + "T12:00:00").toLocaleDateString("es-MX", {
						weekday: "long",
						day: "numeric",
						month: "long",
					})}
				</span>
			</div>

			{/* Tarjetas de partidos */}
			{selected.matches.length === 0 ? (
				<div className="bg-surface-2 border border-line rounded-xl p-4 text-center text-ink-3 text-sm">
					{t("matchdayView.noMatches")}
				</div>
			) : (
				<div className="flex flex-col gap-2">
					{selected.matches.map((match) => (
						<MatchCard key={match.matchId} match={match} />
					))}
				</div>
			)}
		</div>
	);
}
