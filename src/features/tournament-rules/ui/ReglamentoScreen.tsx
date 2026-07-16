"use client";

/**
 * features/tournament-rules/ui/ReglamentoScreen.tsx
 * Orquestador de "Reglamento del torneo" (A6, docs/MODULOS-GESTION-LIGA.md).
 * Estado servidor vía useLeagueRules/useUpdateLeagueRules; el draft local
 * solo existe para permitir "Descartar" antes de "Guardar reglas".
 */
import { useState } from "react";
import { Lock } from "lucide-react";
import type { UpdateLeagueConfigInput } from "@/entities/league-config";
import { useLeagueRules } from "../model/useLeagueRules";
import { useUpdateLeagueRules } from "../model/useUpdateLeagueRules";
import type { RulesFormView } from "../types";
import { DisciplineSection } from "./DisciplineSection";
import { FinanceSection } from "./FinanceSection";
import { SectionCard } from "./primitives";
import { ReinforcementSection } from "./ReinforcementSection";
import { TiebreakerList } from "./TiebreakerList";

type Props = {
	leagueId: string;
	leagueName: string;
	seasonLabel: string;
	initialView: RulesFormView;
};

function toUpdateInput(draft: RulesFormView): UpdateLeagueConfigInput {
	return {
		tiebreakers: draft.tiebreakers,
		yellowThreshold: draft.yellowThreshold,
		redCardMatches: draft.redCardMatches,
		blueCardMeaning: draft.blueCardMeaning,
		reinforcementLimit: draft.reinforcementLimit,
		financeLevel: draft.financeLevel,
	};
}

export function ReglamentoScreen({ leagueId, leagueName, seasonLabel, initialView }: Props) {
	const { data: saved } = useLeagueRules(leagueId, initialView);
	const mutation = useUpdateLeagueRules(leagueId);
	const [draft, setDraft] = useState<RulesFormView>(saved);
	const locked = saved.isLocked;

	const patch = (fields: Partial<RulesFormView>) => setDraft((d) => ({ ...d, ...fields }));
	const handleDiscard = () => setDraft(saved);
	const handleSave = () =>
		mutation.mutate(toUpdateInput(draft), { onSuccess: (view) => setDraft(view) });

	return (
		<div className="flex flex-col gap-5">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<p className="text-xs font-bold tracking-[0.14em] uppercase text-ink-3 mb-1.5">
						Reglas del torneo
					</p>
					<h1 className="font-display text-2xl font-black tracking-tight text-ink">
						{leagueName} · {seasonLabel}
					</h1>
				</div>
				{locked ? (
					<span className="chip amber">
						<Lock size={11} /> Bloqueado
					</span>
				) : (
					<span className="chip brand">Editable</span>
				)}
			</div>

			{locked && (
				<div className="flex gap-3 items-start px-[18px] py-4 rounded-xl bg-[var(--tint-amber)] border border-[var(--tint-amber-bd)]">
					<Lock size={18} className="text-amber shrink-0 mt-0.5" />
					<div>
						<p className="text-sm font-bold text-amber">El torneo ya está en curso</p>
						<p className="text-[13px] text-ink-2 mt-1 leading-relaxed">
							Las reglas quedaron fijas al arrancar la Jornada 1 para proteger la integridad de la
							competencia. Para modificarlas, contacta a soporte.
						</p>
					</div>
				</div>
			)}

			<SectionCard
				title="Criterios de desempate"
				subtitle="Arrastra para cambiar el orden de prioridad en la tabla de posiciones."
				locked={locked}
			>
				<TiebreakerList
					items={draft.tiebreakers}
					onChange={(tiebreakers) => patch({ tiebreakers })}
					locked={locked}
				/>
			</SectionCard>

			<DisciplineSection
				yellowThreshold={draft.yellowThreshold}
				redCardMatches={draft.redCardMatches}
				blueCardMeaning={draft.blueCardMeaning}
				onYellowThresholdChange={(yellowThreshold) => patch({ yellowThreshold })}
				onRedCardMatchesChange={(redCardMatches) => patch({ redCardMatches })}
				onBlueCardMeaningChange={(blueCardMeaning) => patch({ blueCardMeaning })}
				locked={locked}
			/>

			<ReinforcementSection
				reinforcementLimit={draft.reinforcementLimit}
				onChange={(reinforcementLimit) => patch({ reinforcementLimit })}
				locked={locked}
			/>

			<FinanceSection
				financeLevel={draft.financeLevel}
				onChange={(financeLevel) => patch({ financeLevel })}
			/>

			{mutation.isError && <p className="text-sm text-rose">{mutation.error.message}</p>}

			<div className="sticky bottom-0 z-40 bg-surface/95 backdrop-blur border-t border-line rounded-t-xl">
				<div className="px-5 py-4 flex items-center justify-end gap-2.5">
					<span className="text-[13px] text-ink-3 mr-auto">
						{locked
							? "Solo lectura mientras el torneo está en curso."
							: "Los cambios aplican a partir de la siguiente fecha."}
					</span>
					<button
						type="button"
						disabled={locked || mutation.isPending}
						onClick={handleDiscard}
						className="h-[42px] px-[18px] rounded-[9px] border border-line bg-transparent text-ink-2 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
					>
						Descartar
					</button>
					<button
						type="button"
						disabled={locked || mutation.isPending}
						onClick={handleSave}
						className="h-[42px] px-[22px] rounded-[9px] border border-brand bg-brand text-[#04371c] text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{mutation.isPending ? "Guardando…" : "Guardar reglas"}
					</button>
				</div>
			</div>
		</div>
	);
}
