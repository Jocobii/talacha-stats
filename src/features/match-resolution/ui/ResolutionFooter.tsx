"use client";
/**
 * features/match-resolution/ui/ResolutionFooter.tsx
 * Footer con totales por equipo, cuadre de marcador y observaciones.
 */
import {
	computeTeamGoals,
	computeTeamCards,
	computePresentCount,
	computeAttributionGap,
} from "../lib/compute-totals";
import type { ResolutionState } from "../types";

type Props = {
	state: ResolutionState;
	onObservationsChange: (v: string) => void;
};

type GapIndicatorProps = { gap: number };

function GapIndicator({ gap }: GapIndicatorProps) {
	if (gap === 0) return <span className="text-brand-ink font-medium">✓ Cuadrado</span>;
	if (gap > 0)
		return <span className="text-amber font-medium">⚠ Falta atribuir {gap} gol(es)</span>;
	return <span className="text-rose font-medium">✗ Sobran {Math.abs(gap)} gol(es)</span>;
}

type TeamTotalsProps = {
	label: string;
	players: ResolutionState["homePlayers"];
	score: number | null;
	bonus: number;
};

function TeamTotals({ label, players, score, bonus }: TeamTotalsProps) {
	const playerGoals = computeTeamGoals(players);
	const cards = computeTeamCards(players);
	const present = computePresentCount(players);
	const gap = computeAttributionGap(score, playerGoals, bonus);

	return (
		<div className="flex flex-wrap items-center gap-3 text-xs text-ink-2 py-2 px-4 border-b border-line last:border-0">
			<span className="font-semibold text-ink w-24 shrink-0">{label}</span>
			<span>
				Presentes:{" "}
				<b className="text-ink">
					{present}/{players.length}
				</b>
			</span>
			<span>
				Goles:{" "}
				<b className="text-ink">
					{playerGoals} jug. + {bonus} eq. = {playerGoals + bonus}
				</b>
			</span>
			<span>
				Tarjetas: <b className="text-amber">{cards.yellow}AM</b>
				{" / "}
				<b className="text-blue">{cards.blue}AZ</b>
				{" / "}
				<b className="text-rose">{cards.red}RO</b>
			</span>
			<GapIndicator gap={gap} />
		</div>
	);
}

export function ResolutionFooter({ state, onObservationsChange }: Props) {
	return (
		<footer className="bg-surface border-t border-line mt-2">
			<TeamTotals
				label={`Local (${state.homeScore ?? "—"})`}
				players={state.homePlayers}
				score={state.homeScore}
				bonus={state.homeBonusGoals}
			/>
			<TeamTotals
				label={`Visitante (${state.awayScore ?? "—"})`}
				players={state.awayPlayers}
				score={state.awayScore}
				bonus={state.awayBonusGoals}
			/>
			<div className="px-4 py-3">
				<label className="text-xs text-ink-3 block mb-1">Observaciones del árbitro</label>
				<textarea
					rows={2}
					maxLength={2000}
					value={state.refereeObservations ?? ""}
					onChange={(e) => onObservationsChange(e.target.value)}
					placeholder="Incidencias, jugadores expulsados, etc."
					className="w-full bg-surface-2 border border-line text-ink placeholder:text-ink-3 rounded px-2 py-1.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand/30"
				/>
			</div>
		</footer>
	);
}
