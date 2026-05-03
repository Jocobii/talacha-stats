import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { titleCase } from "@/shared/lib/normalize";

export type ScorerData = {
	playerId: string | null;
	fullName: string;
	alias: string | null;
	goals: number;
	assists: number;
	matchesPlayed: number;
	teamName: string;
};

type Props = { scorer: ScorerData; rank: number };

/**
 * Tarjeta de goleador clickable que lleva al perfil público del jugador.
 * Si no hay playerId (stats del nuevo pipeline sin claim verificado) se
 * muestra sin enlace.
 */
export default function ScorerCard({ scorer, rank }: Props) {
	const isTop3 = rank <= 3;

	const displayName = scorer.alias ? `"${titleCase(scorer.alias)}"` : titleCase(scorer.fullName);

	const initial = (scorer.alias ?? scorer.fullName).charAt(0).toUpperCase();

	const goalsPerGame =
		scorer.matchesPlayed > 0 ? (scorer.goals / scorer.matchesPlayed).toFixed(1) : null;

	const inner = (
		<>
			{/* Posición */}
			{isTop3 ? (
				<div className="w-7 h-7 rounded-lg bg-brand/10 border border-brand/20 flex items-center justify-center shrink-0">
					<span className="font-display font-black text-sm text-brand">{rank}</span>
				</div>
			) : (
				<div className="w-7 text-center shrink-0 font-display font-black text-sm text-ink-3">
					{rank}
				</div>
			)}

			{/* Avatar */}
			<div className="w-9 h-9 rounded-full bg-brand flex items-center justify-center text-pitch font-display font-black text-sm shrink-0">
				{initial}
			</div>

			{/* Nombre + equipo + PJ */}
			<div className="flex-1 min-w-0">
				<p className="font-semibold text-sm text-ink group-hover:text-brand transition-colors truncate">
					{displayName}
				</p>
				<div className="flex items-center gap-1.5 mt-0.5">
					<span className="text-xs text-ink-3 truncate">{titleCase(scorer.teamName)}</span>
					{scorer.matchesPlayed > 0 && (
						<span className="text-[10px] text-ink-3 shrink-0">· {scorer.matchesPlayed} PJ</span>
					)}
				</div>
			</div>

			{/* Stats: goles + detalle secundario */}
			<div className="text-right shrink-0">
				<p
					className={`font-display font-black text-xl leading-none ${isTop3 ? "text-brand" : "text-ink"}`}
				>
					{scorer.goals}
				</p>
				<p className="text-[10px] text-ink-3 mt-0.5">
					{scorer.assists > 0
						? `${scorer.assists} ast`
						: goalsPerGame
							? `${goalsPerGame}/PJ`
							: "goles"}
				</p>
			</div>

			{scorer.playerId && (
				<ChevronRight
					size={14}
					strokeWidth={2}
					className="text-ink-3 group-hover:text-brand transition-colors shrink-0"
				/>
			)}
		</>
	);

	const className =
		"flex items-center gap-3 bg-surface-2 border border-line rounded-2xl px-4 py-3 transition-colors group";

	if (scorer.playerId) {
		return (
			<Link href={`/player/${scorer.playerId}`} className={className + " hover:border-brand/40"}>
				{inner}
			</Link>
		);
	}

	return <div className={className}>{inner}</div>;
}
