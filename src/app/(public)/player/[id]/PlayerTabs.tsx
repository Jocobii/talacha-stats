"use client";

import { useState } from "react";
import type {
	PlayerLeagueStats,
	PlayerGlobalProfile,
	PlayerTeamGoalShare,
} from "@/entities/player";

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab = "temporada" | "carrera";

type Props = {
	leagues: PlayerLeagueStats[];
	teamGoalShares: PlayerTeamGoalShare[];
	global: PlayerGlobalProfile;
};

// ── Main component ────────────────────────────────────────────────────────────

export default function PlayerTabs({ leagues, teamGoalShares, global: g }: Props) {
	const [active, setActive] = useState<Tab>("temporada");

	const shareByLeague = new Map<string, PlayerTeamGoalShare>(
		teamGoalShares.map((s) => [s.leagueId, s]),
	);

	return (
		<div className="flex flex-col gap-4">
			{/* Tab bar */}
			<div className="flex gap-1 bg-surface border border-line rounded-xl p-1">
				<TabButton
					label="Temporada"
					active={active === "temporada"}
					onClick={() => setActive("temporada")}
				/>
				<TabButton
					label="Carrera"
					active={active === "carrera"}
					onClick={() => setActive("carrera")}
				/>
			</div>

			{/* Tab content */}
			{active === "temporada" && <TemporadaTab leagues={leagues} shareByLeague={shareByLeague} />}
			{active === "carrera" && <CarreraTab leagues={leagues} global={g} />}
		</div>
	);
}

// ── Tab button ────────────────────────────────────────────────────────────────

function TabButton({
	label,
	active,
	onClick,
}: {
	label: string;
	active: boolean;
	onClick: () => void;
}) {
	return (
		<button
			onClick={onClick}
			className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${
				active ? "bg-brand text-pitch" : "text-ink-2 hover:text-ink"
			}`}
		>
			{label}
		</button>
	);
}

// ── Tab 1: Temporada ──────────────────────────────────────────────────────────

function TemporadaTab({
	leagues,
	shareByLeague,
}: {
	leagues: PlayerLeagueStats[];
	shareByLeague: Map<string, PlayerTeamGoalShare>;
}) {
	const active = leagues.filter((l) => l.leagueStatus === "active");

	if (active.length === 0) {
		return <EmptyState message="Este jugador no tiene ligas activas en este momento." />;
	}

	return (
		<div className="flex flex-col gap-3">
			<p className="text-[11px] font-bold text-ink-2 uppercase tracking-widest px-1">
				En curso ({active.length})
			</p>
			{active.map((l) => (
				<LeagueCard key={l.leagueId} league={l} teamShare={shareByLeague.get(l.leagueId)} />
			))}
		</div>
	);
}

// ── Tab 2: Carrera ────────────────────────────────────────────────────────────

function CarreraTab({
	leagues,
	global: g,
}: {
	leagues: PlayerLeagueStats[];
	global: PlayerGlobalProfile;
}) {
	const finished = leagues.filter((l) => l.leagueStatus === "finished");

	if (finished.length === 0) {
		return <EmptyState message="Aún no hay ligas terminadas en el historial." />;
	}

	const totalGoals = finished.reduce((s, l) => s + l.goals, 0);
	const totalMatches = finished.reduce((s, l) => s + l.matchesPlayed, 0);
	const totalAssists = finished.reduce((s, l) => s + l.assists, 0);

	return (
		<div className="flex flex-col gap-4">
			{/* Career summary — solo ligas terminadas */}
			<div className="bg-surface border border-line rounded-2xl p-4 flex items-center justify-between gap-4">
				<div>
					<p className="text-[11px] font-bold text-ink-2 uppercase tracking-widest mb-1">
						Historial terminado
					</p>
					<p className="font-display font-black text-3xl text-brand-ink leading-none">
						{totalGoals}
						<span className="text-ink-2 text-base font-sans font-normal ml-2">goles</span>
					</p>
				</div>
				<div className="flex gap-4 text-center">
					<div>
						<p className="font-display font-black text-xl text-ink leading-none">{totalMatches}</p>
						<p className="text-[10px] text-ink-2 mt-0.5">PJ</p>
					</div>
					<div>
						<p className="font-display font-black text-xl text-ink leading-none">{totalAssists}</p>
						<p className="text-[10px] text-ink-2 mt-0.5">Asist.</p>
					</div>
					<div>
						<p className="font-display font-black text-xl text-ink leading-none">
							{finished.length}
						</p>
						<p className="text-[10px] text-ink-2 mt-0.5">
							Temporada{finished.length !== 1 ? "s" : ""}
						</p>
					</div>
				</div>
			</div>

			{/* Timeline de ligas terminadas */}
			<div className="flex flex-col gap-2">
				<p className="text-[11px] font-bold text-ink-2 uppercase tracking-widest px-1">
					Temporadas anteriores ({finished.length})
				</p>
				{finished.map((l, idx) => (
					<CareerRow key={`${l.leagueId}-${idx}`} league={l} />
				))}
			</div>
		</div>
	);
}

// ── Career row ────────────────────────────────────────────────────────────────

function CareerRow({ league: l }: { league: PlayerLeagueStats }) {
	const gpmColor =
		l.goalsPerMatch >= 1
			? "text-brand-ink"
			: l.goalsPerMatch >= 0.5
				? "text-yellow-400"
				: "text-ink-2";

	return (
		<div className="bg-surface border border-line rounded-xl p-3 flex items-center gap-3">
			{/* Left: dot indicator */}
			<div className="w-2 h-2 rounded-full bg-brand shrink-0 mt-0.5 self-start" />

			{/* Center: league info */}
			<div className="flex-1 min-w-0">
				<p className="font-bold text-ink text-sm leading-tight truncate">{l.leagueName}</p>
				<p className="text-[11px] text-ink-2 capitalize mt-0.5">
					{l.season} · {l.dayOfWeek}
				</p>
				<p className="text-[11px] text-ink-3 mt-0.5">{l.teamName}</p>
			</div>

			{/* Right: quick stats */}
			<div className="flex gap-3 text-center shrink-0">
				<div>
					<p className="font-display font-black text-lg text-brand-ink leading-none">{l.goals}</p>
					<p className="text-[10px] text-ink-2">Goles</p>
				</div>
				{l.assists > 0 && (
					<div>
						<p className="font-display font-black text-lg text-ink leading-none">{l.assists}</p>
						<p className="text-[10px] text-ink-2">Asist.</p>
					</div>
				)}
				{l.matchesPlayed > 0 && (
					<div>
						<p className={`font-display font-black text-lg leading-none ${gpmColor}`}>
							{l.goalsPerMatch.toFixed(1)}
						</p>
						<p className="text-[10px] text-ink-2">G/PJ</p>
					</div>
				)}
			</div>
		</div>
	);
}

// ── LeagueCard (duplicated from page.tsx to keep this file self-contained) ───

function LeagueCard({
	league: l,
	teamShare,
}: {
	league: PlayerLeagueStats;
	teamShare?: PlayerTeamGoalShare;
}) {
	const gpmColor =
		l.goalsPerMatch >= 1
			? "text-brand-ink"
			: l.goalsPerMatch >= 0.5
				? "text-yellow-400"
				: "text-ink-2";

	return (
		<div className="bg-surface border border-line rounded-2xl overflow-hidden">
			<div className="h-0.5 bg-brand" />
			<div className="p-4 flex flex-col gap-3">
				{/* Header */}
				<div className="flex items-start justify-between gap-2">
					<div>
						<p className="font-bold text-ink text-sm">{l.leagueName}</p>
						<p className="text-[11px] text-ink-2 capitalize mt-0.5">
							{l.dayOfWeek} · {l.season}
						</p>
						<p className="text-xs text-ink-3 mt-1">{l.teamName}</p>
					</div>
					{l.goals > 0 && l.matchesPlayed > 0 && (
						<div className="text-right shrink-0">
							<p className={`font-display font-black text-3xl leading-none ${gpmColor}`}>
								{l.goalsPerMatch.toFixed(2)}
							</p>
							<p className="text-[10px] text-ink-2 mt-0.5">goles/PJ</p>
						</div>
					)}
				</div>

				{/* Stats row */}
				<div className="grid grid-cols-3 gap-2">
					<LeagueStat label="Goles" value={l.goals} accent />
					<LeagueStat label="Asist." value={l.assists} />
					<LeagueStat label="PJ" value={l.matchesPlayed} />
				</div>

				{/* Team goal share */}
				{teamShare && teamShare.sharePercent >= 20 && <TeamShareBar share={teamShare} />}

				{/* Cards */}
				{(l.yellowCards > 0 || l.redCards > 0) && (
					<div className="flex gap-3 text-[11px] text-ink-2">
						{l.yellowCards > 0 && (
							<span>
								🟨 {l.yellowCards} amarilla{l.yellowCards !== 1 ? "s" : ""}
							</span>
						)}
						{l.redCards > 0 && (
							<span>
								🟥 {l.redCards} roja{l.redCards !== 1 ? "s" : ""}
							</span>
						)}
					</div>
				)}
			</div>
		</div>
	);
}

function LeagueStat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
	return (
		<div className="rounded-xl bg-surface-2 p-2.5 text-center">
			<p
				className={`font-display font-black text-xl leading-none ${accent ? "text-brand-ink" : "text-ink"}`}
			>
				{value}
			</p>
			<p className="text-[10px] text-ink-2 mt-0.5">{label}</p>
		</div>
	);
}

function TeamShareBar({ share }: { share: PlayerTeamGoalShare }) {
	const pct = Math.min(share.sharePercent, 100);
	const barColor = pct >= 50 ? "bg-brand" : pct >= 30 ? "bg-yellow-400" : "bg-ink-3";

	return (
		<div>
			<div className="flex justify-between items-center mb-1.5">
				<p className="text-[11px] text-ink-2">{share.sharePercent}% de los goles del equipo</p>
				<p className="text-[11px] text-ink-3">
					{share.playerGoals}/{share.teamGoals}
				</p>
			</div>
			<div className="h-1 bg-line rounded-full overflow-hidden">
				<div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
			</div>
		</div>
	);
}

function EmptyState({ message }: { message: string }) {
	return (
		<div className="bg-surface border border-line rounded-2xl p-8 text-center text-ink-2 text-sm">
			{message}
		</div>
	);
}
