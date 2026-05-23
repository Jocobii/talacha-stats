/**
 * PublicBracketView.tsx
 *
 * Read-only bracket display for the public league page.
 * Renders all zones' brackets as compact round columns.
 */

import { getZoneTokens } from "@/shared/lib/zone-colors";

export type PublicSlot = {
	id: string;
	round: number;
	slotIndex: number;
	isThirdPlace: boolean;
	isBye: boolean;
	homeTeam: { id: string; name: string } | null;
	awayTeam: { id: string; name: string } | null;
	winner: { id: string; name: string } | null;
};

export type PublicBracket = {
	id: string;
	zoneName: string;
	zoneColor: string;
	slots: PublicSlot[];
};

type Props = { brackets: PublicBracket[] };

const ROUND_LABELS: Record<string, string> = {
	"1-multi": "Cuartos",
	"2-multi": "Semis",
	"3-multi": "Final",
	"1-single": "Final",
};

export function PublicBracketView({ brackets }: Props) {
	if (brackets.length === 0) {
		return (
			<div className="bg-surface-2 border border-line rounded-2xl p-6 text-center text-ink-3 text-sm">
				La fase final aún no ha comenzado.
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{brackets.map((bracket) => (
				<PublicBracketZone key={bracket.id} bracket={bracket} />
			))}
		</div>
	);
}

function PublicBracketZone({ bracket }: { bracket: PublicBracket }) {
	const tokens = getZoneTokens(bracket.zoneColor);

	// Group by round
	const byRound = new Map<number, PublicSlot[]>();
	for (const slot of bracket.slots) {
		if (!byRound.has(slot.round)) byRound.set(slot.round, []);
		byRound.get(slot.round)!.push(slot);
	}

	const rounds = [...byRound.keys()].sort((a, b) => a - b);
	const totalRounds = rounds.length;

	return (
		<div className="bg-surface-2 border border-line rounded-2xl overflow-hidden">
			{/* Zone header */}
			<div className={`flex items-center gap-2 px-4 py-2.5 border-b border-line ${tokens.rowBg}`}>
				<span className={`w-2 h-2 rounded-full ${tokens.dot}`} />
				<span className={`text-sm font-bold ${tokens.badgeText}`}>{bracket.zoneName}</span>
			</div>

			{/* Rounds — horizontally scrollable */}
			<div className="overflow-x-auto px-3 py-4">
				<div className="flex gap-4 min-w-max items-start">
					{rounds.map((round) => {
						const slots = byRound.get(round) ?? [];
						const mainSlots = slots.filter((s) => !s.isThirdPlace);
						const thirdSlots = slots.filter((s) => s.isThirdPlace);
						const labelKey = totalRounds === 1 ? "1-single" : `${round}-multi`;
						const label =
							round === rounds.at(-1) && mainSlots.length === 1
								? "Final"
								: (ROUND_LABELS[labelKey] ?? `R${round}`);

						return (
							<div key={round} className="flex flex-col items-center gap-1">
								<p className="text-[9px] font-bold text-ink-3 uppercase tracking-widest mb-1">
									{label}
								</p>
								<div className="flex flex-col gap-2.5">
									{mainSlots.map((slot) => (
										<PublicSlotCard key={slot.id} slot={slot} />
									))}
								</div>
								{thirdSlots.length > 0 && (
									<div className="mt-3 flex flex-col gap-2.5">
										<p className="text-[9px] text-ink-3 text-center">3er lugar</p>
										{thirdSlots.map((slot) => (
											<PublicSlotCard key={slot.id} slot={slot} />
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

function PublicSlotCard({ slot }: { slot: PublicSlot }) {
	const isHomeWinner = slot.winner !== null && slot.winner.id === slot.homeTeam?.id;
	const isAwayWinner = slot.winner !== null && slot.winner.id === slot.awayTeam?.id;
	const hasResult = slot.winner !== null;

	if (slot.isBye) {
		return (
			<div className="w-36 bg-surface border border-line rounded-lg px-2.5 py-2">
				<p className="text-xs text-ink-3 italic">Descansa</p>
			</div>
		);
	}

	return (
		<div className="w-36 bg-surface border border-line rounded-lg overflow-hidden">
			<SlotTeamRow team={slot.homeTeam} isWinner={isHomeWinner} hasResult={hasResult} isTop />
			<SlotTeamRow
				team={slot.awayTeam}
				isWinner={isAwayWinner}
				hasResult={hasResult}
				isTop={false}
			/>
		</div>
	);
}

function SlotTeamRow({
	team,
	isWinner,
	hasResult,
	isTop,
}: {
	team: { name: string } | null;
	isWinner: boolean;
	hasResult: boolean;
	isTop: boolean;
}) {
	return (
		<div
			className={`flex items-center gap-1 px-2 py-1.5 ${
				isTop ? "border-b border-line" : ""
			} ${isWinner ? "bg-brand/8 border-l-2 border-l-brand" : "border-l-2 border-l-transparent"}`}
		>
			<span
				className={`text-[11px] truncate flex-1 ${
					isWinner ? "font-bold text-ink" : hasResult ? "text-ink-3 line-through" : "text-ink-2"
				}`}
			>
				{team?.name ?? "—"}
			</span>
			{isWinner && <span className="text-brand-ink text-[9px] font-black shrink-0">✓</span>}
		</div>
	);
}
