import Link from "next/link";
import { ChevronRight, Trophy, Crosshair } from "lucide-react";
import type { LeagueSnapshot } from "@/entities/organization";
import { titleCase } from "@/shared/lib/normalize";

// Mapa de día completo → abreviatura de 3 letras para el badge
const DAY_ABBR: Record<string, string> = {
	lunes: "LUN",
	martes: "MAR",
	miercoles: "MIÉ",
	jueves: "JUE",
	viernes: "VIE",
	sabado: "SÁB",
	domingo: "DOM",
};

type League = {
	id: string;
	name: string;
	slug: string | null;
	season: string;
	dayOfWeek: string;
	teams: unknown[];
};

type Props = {
	league: League;
	snapshot: LeagueSnapshot;
	orgSlug: string;
};

export default function LeagueSnapshotCard({ league, snapshot, orgSlug }: Props) {
	const abbr =
		DAY_ABBR[league.dayOfWeek.toLowerCase()] ?? league.dayOfWeek.slice(0, 3).toUpperCase();
	const hasSnapshot = snapshot.leader !== null || snapshot.topScorer !== null;

	return (
		<Link
			href={`/org/${orgSlug}/${league.slug}`}
			className="block bg-surface-2 border border-line rounded-2xl p-4 hover:border-brand/40 transition-colors group"
		>
			<LeagueCardHeader
				abbr={abbr}
				name={league.name}
				season={league.season}
				teamCount={league.teams.length}
				lastJornada={snapshot.lastJornada}
			/>

			{hasSnapshot && (
				<div className="mt-3 pt-3 border-t border-line space-y-2">
					{snapshot.leader && <LeaderRow leader={snapshot.leader} />}
					{snapshot.topScorer && <ScorerRow scorer={snapshot.topScorer} />}
				</div>
			)}
		</Link>
	);
}

// ── Sub-componentes internos ───────────────────────────────────────────────────

function LeagueCardHeader({
	abbr,
	name,
	season,
	teamCount,
	lastJornada,
}: {
	abbr: string;
	name: string;
	season: string;
	teamCount: number;
	lastJornada: number | null;
}) {
	return (
		<div className="flex items-center gap-3">
			<DayBadge abbr={abbr} />
			<div className="flex-1 min-w-0">
				<p className="font-semibold text-sm text-ink group-hover:text-brand-ink transition-colors truncate">
					{titleCase(name)}
				</p>
				<p className="text-xs text-ink-3">
					{season} · {teamCount} equipo{teamCount !== 1 ? "s" : ""}
				</p>
			</div>
			<div className="flex items-center gap-2 shrink-0">
				{lastJornada && (
					<span className="text-[10px] font-bold text-brand-ink bg-brand/10 border border-brand/20 rounded-lg px-2 py-0.5">
						J{lastJornada}
					</span>
				)}
				<ChevronRight
					size={16}
					strokeWidth={2}
					className="text-ink-3 group-hover:text-brand-ink transition-colors"
				/>
			</div>
		</div>
	);
}

function DayBadge({ abbr }: { abbr: string }) {
	return (
		<div className="w-10 h-10 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center shrink-0">
			<span className="font-display font-black text-xs text-brand-ink">{abbr}</span>
		</div>
	);
}

function LeaderRow({ leader }: { leader: NonNullable<LeagueSnapshot["leader"]> }) {
	return (
		<div className="flex items-center gap-2">
			<Trophy size={13} strokeWidth={2} className="text-brand-ink shrink-0" />
			<span className="text-xs font-semibold text-ink truncate flex-1">
				{titleCase(leader.teamName)}
			</span>
			<span className="text-xs font-black text-brand-ink shrink-0">{leader.points} pts</span>
		</div>
	);
}

function ScorerRow({ scorer }: { scorer: NonNullable<LeagueSnapshot["topScorer"]> }) {
	const displayName = scorer.alias ? `"${titleCase(scorer.alias)}"` : titleCase(scorer.fullName);
	return (
		<div className="flex items-center gap-2">
			<Crosshair size={13} strokeWidth={2} className="text-ink-3 shrink-0" />
			<span className="text-xs text-ink-2 truncate flex-1">{displayName}</span>
			<span className="text-xs font-bold text-ink-2 shrink-0">{scorer.goals} goles</span>
		</div>
	);
}
