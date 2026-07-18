"use client";

/**
 * app/(public)/org/[slug]/[leagueSlug]/MatchdayPublicView.tsx
 *
 * Vista pública de jornadas: chips de selección + tarjetas de partidos.
 * Solo lectura.
 */

import { useState } from "react";
import { CalendarDays, Clock, MapPin, AlertCircle, ChevronDown } from "lucide-react";
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

/** Etiqueta de una jornada para el <select>: "J{n}" en fase regular, "Fase Final" en playoff. */
function matchdayLabel(md: PublicMatchday, t: ReturnType<typeof useTranslations>): string {
	return md.phase === "regular" ? `J${md.number}` : t("matchdayView.playoffPhase");
}

export default function MatchdayPublicView({ matchdays }: Props) {
	const t = useTranslations("org");
	// Por default se muestra la última jornada (la más reciente / la fase
	// actual), no la primera — matchdays ya viene ordenado de la fase
	// regular más antigua a la más nueva, con la fase final (si existe)
	// siempre al final sin importar su `number` sentinel (ver queries.ts).
	const [selectedIdx, setSelectedIdx] = useState(() => Math.max(matchdays.length - 1, 0));

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
			{/* Selector de jornada — un <select> nativo en vez de chips: en la
			    versión anterior los chips no daban scroll lateral en algunos
			    navegadores/dispositivos, dejando jornadas inalcanzables. */}
			<div className="relative">
				<select
					value={selectedIdx}
					onChange={(e) => setSelectedIdx(Number(e.target.value))}
					className="w-full appearance-none bg-surface-2 border border-line rounded-xl pl-3.5 pr-9 py-2.5 text-sm font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-brand/30"
				>
					{matchdays.map((md, i) => (
						<option key={md.id} value={i}>
							{matchdayLabel(md, t)}
						</option>
					))}
				</select>
				<ChevronDown
					size={16}
					className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-3"
				/>
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
