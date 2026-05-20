"use client";
/**
 * BracketView.tsx
 *
 * Renders all playoff brackets (one per zone) as bracket columns.
 * Rounds go left → right: QF (R1) → SF (R2) → Final + 3rd (R3).
 */

import { useEffect } from "react";
import { getZoneTokens } from "@/shared/lib/zone-colors";
import { BracketSlot } from "./BracketSlot";
import type { SlotData } from "./BracketSlot";

export type BracketData = {
	id: string;
	zoneName: string;
	zoneColor: string;
	slots: SlotData[];
};

type Props = {
	brackets: BracketData[];
	leagueId: string;
	playoffMatchdayId: string;
	allTeams: { id: string; name: string }[];
};

const ROUND_LABELS: Record<number, string> = {
	1: "Cuartos",
	2: "Semis",
	3: "Final",
};

export function BracketView({ brackets, leagueId, playoffMatchdayId, allTeams }: Props) {
	// Fix idempotente: reasigna partidos de playoff al matchday correcto si quedaron
	// en una jornada regular por el bug del winner-propagator (sin filtro phase).
	useEffect(() => {
		void fetch(`/api/leagues/${leagueId}/playoffs/fix-match-assignments`, { method: "POST" });
	}, [leagueId]);

	if (brackets.length === 0) return null;

	return (
		<div className="space-y-6">
			{brackets.map((bracket) => (
				<BracketZone
					key={bracket.id}
					bracket={bracket}
					leagueId={leagueId}
					playoffMatchdayId={playoffMatchdayId}
					allTeams={allTeams}
				/>
			))}
		</div>
	);
}

// ── Per-zone bracket ──────────────────────────────────────────────────────────

type BracketZoneProps = {
	bracket: BracketData;
	leagueId: string;
	playoffMatchdayId: string;
	allTeams: { id: string; name: string }[];
};

function BracketZone({ bracket, leagueId, playoffMatchdayId, allTeams }: BracketZoneProps) {
	const tokens = getZoneTokens(bracket.zoneColor);

	const byRound = new Map<number, SlotData[]>();
	for (const slot of bracket.slots) {
		if (!byRound.has(slot.round)) byRound.set(slot.round, []);
		byRound.get(slot.round)!.push(slot);
	}

	const rounds = [...byRound.keys()].sort((a, b) => a - b);
	const maxRound = rounds.at(-1) ?? 1;

	return (
		<div className="bg-surface rounded-lg shadow overflow-hidden">
			{/* Header */}
			<div className={`flex items-center gap-2 px-4 py-2.5 border-b border-line ${tokens.rowBg}`}>
				<span className={`w-2 h-2 rounded-full ${tokens.dot}`} />
				<span className={`text-sm font-bold ${tokens.badgeText}`}>{bracket.zoneName}</span>
			</div>

			{/* Bracket columns — scrollable on mobile */}
			<div className="overflow-x-auto px-4 py-4">
				<div className="flex gap-6 min-w-max items-start">
					{rounds.map((round) => {
						const slots = byRound.get(round) ?? [];
						const mainSlots = slots.filter((s) => !s.isThirdPlace);
						const thirdSlots = slots.filter((s) => s.isThirdPlace);

						const roundLabel =
							round === maxRound && mainSlots.length === 1
								? "Final"
								: (ROUND_LABELS[round] ?? `R${round}`);

						return (
							<div key={round} className="flex flex-col gap-2">
								<p className="text-[10px] font-bold text-ink-3 uppercase tracking-widest mb-1 text-center">
									{roundLabel}
								</p>

								<div className="flex flex-col gap-3">
									{mainSlots.map((slot) => (
										<BracketSlot
											key={slot.id}
											slot={slot}
											bracketId={bracket.id}
											leagueId={leagueId}
											playoffMatchdayId={playoffMatchdayId}
											availableTeams={allTeams}
										/>
									))}
								</div>

								{thirdSlots.length > 0 && (
									<div className="mt-4 flex flex-col gap-3">
										{thirdSlots.map((slot) => (
											<BracketSlot
												key={slot.id}
												slot={slot}
												bracketId={bracket.id}
												leagueId={leagueId}
												playoffMatchdayId={playoffMatchdayId}
												availableTeams={allTeams}
											/>
										))}
									</div>
								)}
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}
