"use client";

/**
 * features/league-onboarding/ui/PlayerPreviewCard.tsx
 * Mockup de perfil de jugadora — vista previa en LeagueChoicePage.
 */

import { Avatar } from "@/shared/ui/Avatar";

export function PlayerPreviewCard() {
	return (
		<div className="bg-surface border border-line rounded-lg p-4 relative overflow-hidden">
			<div className="flex items-center justify-between mb-3">
				<span className="font-mono text-[9.5px] tracking-[0.18em] uppercase text-brand-ink font-bold">
					TalachaStats
				</span>
				<span className="font-mono text-[9px] tracking-[0.14em] uppercase text-ink-3">PERFIL</span>
			</div>

			<div className="flex items-start gap-3">
				<Avatar initials="MG" size="lg" />
				<div className="min-w-0">
					<div className="text-[10px] font-semibold tracking-[0.14em] uppercase text-brand-ink">
						● Goleadora
					</div>
					<div className="font-display text-[22px] text-ink leading-none tracking-tight mt-1">
						MARGARITA
					</div>
					<div className="font-display text-[22px] text-ink leading-none tracking-tight text-brand-ink">
						GUTIERREZ
					</div>
				</div>
			</div>

			<div className="mt-4 pt-4 border-t border-line grid grid-cols-3 gap-2">
				<StatMini value={46} label="Goles" brand />
				<StatMini value={2} label="Ligas" />
				<StatMini value={36} label="PJ" />
			</div>

			<div className="mt-3 flex gap-1.5 flex-wrap">
				<span className="inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 h-4 rounded bg-brand text-pitch">
					🥇 GOLEADORA
				</span>
				<span className="inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 h-4 rounded bg-surface-2 border border-line text-ink-2">
					MULTILIGAS
				</span>
			</div>
		</div>
	);
}

function StatMini({ value, label, brand }: { value: number; label: string; brand?: boolean }) {
	return (
		<div>
			<div
				className={`font-display text-[28px] font-black leading-none ${brand ? "text-brand-ink" : "text-ink"}`}
			>
				{value}
			</div>
			<div className="text-[8.5px] tracking-[0.14em] uppercase text-ink-3 mt-1">{label}</div>
		</div>
	);
}
