"use client";

/**
 * features/organization-rules/ui/ReglamentoTab.tsx
 * Orquestador del tab Reglamento — calco de tournament-rules/ui/ReglamentoScreen
 * SIN el bloqueo por locked_at (esto es una plantilla, no una liga en curso) y
 * reusando 1:1 las secciones de tournament-rules/ui (docs/ORG-PROFILE-HUB.md §5).
 */
import { useState } from "react";
import type { UpdateOrganizationConfigInput } from "@/entities/organization-config";
import { Button } from "@/shared/ui/Button";
import { SaveButton } from "@/shared/ui/SaveButton";
import { DisciplineSection } from "@/features/tournament-rules/ui/DisciplineSection";
import { FinanceSection } from "@/features/tournament-rules/ui/FinanceSection";
import { ReinforcementSection } from "@/features/tournament-rules/ui/ReinforcementSection";
import { SectionCard } from "@/features/tournament-rules/ui/primitives";
import { TiebreakerList } from "@/features/tournament-rules/ui/TiebreakerList";
import { useOrganizationRules } from "../model/useOrganizationRules";
import { useUpdateOrganizationRules } from "../model/useUpdateOrganizationRules";
import type { OrgRulesFormView } from "../types";

type Props = {
	organizationId: string;
	initialView: OrgRulesFormView;
};

function toUpdateInput(draft: OrgRulesFormView): UpdateOrganizationConfigInput {
	return {
		tiebreakers: draft.tiebreakers,
		yellowThreshold: draft.yellowThreshold,
		redCardMatches: draft.redCardMatches,
		blueCardMeaning: draft.blueCardMeaning,
		reinforcementLimit: draft.reinforcementLimit,
		financeLevel: draft.financeLevel,
	};
}

export function ReglamentoTab({ organizationId, initialView }: Props) {
	const { data: saved } = useOrganizationRules(organizationId, initialView);
	const mutation = useUpdateOrganizationRules(organizationId);
	const [draft, setDraft] = useState<OrgRulesFormView>(saved);

	const patch = (fields: Partial<OrgRulesFormView>) => setDraft((d) => ({ ...d, ...fields }));
	const handleDiscard = () => setDraft(saved);
	const handleSave = () =>
		mutation.mutate(toUpdateInput(draft), { onSuccess: (view) => setDraft(view) });

	return (
		<div className="flex flex-col gap-5">
			<div className="flex items-start gap-2.5 bg-surface-2 border border-line rounded-lg px-4 py-3">
				<p className="text-[12.5px] text-ink-2 leading-snug">
					Estos valores se copian a cada liga nueva al momento de crearla. No afectan ligas ya
					creadas.
				</p>
			</div>

			<SectionCard
				title="Criterios de desempate"
				subtitle="Arrastra para cambiar el orden de prioridad en la tabla de posiciones."
			>
				<TiebreakerList
					items={draft.tiebreakers}
					onChange={(tiebreakers) => patch({ tiebreakers })}
				/>
			</SectionCard>

			<DisciplineSection
				yellowThreshold={draft.yellowThreshold}
				redCardMatches={draft.redCardMatches}
				blueCardMeaning={draft.blueCardMeaning}
				onYellowThresholdChange={(yellowThreshold) => patch({ yellowThreshold })}
				onRedCardMatchesChange={(redCardMatches) => patch({ redCardMatches })}
				onBlueCardMeaningChange={(blueCardMeaning) => patch({ blueCardMeaning })}
			/>

			<ReinforcementSection
				reinforcementLimit={draft.reinforcementLimit}
				onChange={(reinforcementLimit) => patch({ reinforcementLimit })}
			/>

			<FinanceSection
				financeLevel={draft.financeLevel}
				onChange={(financeLevel) => patch({ financeLevel })}
			/>

			<div className="sticky bottom-0 z-40 bg-surface/95 backdrop-blur border-t border-line rounded-t-xl">
				<div className="px-5 py-4 flex items-center justify-end gap-2.5">
					<span className="text-[13px] text-ink-3 mr-auto">
						Aplica a las ligas que se creen a partir de ahora.
					</span>
					<Button
						variant="secondary"
						size="lg"
						disabled={mutation.isPending}
						onClick={handleDiscard}
					>
						Descartar
					</Button>
					<SaveButton
						variant="primary"
						size="lg"
						status={mutation.status}
						errorMessage={mutation.error?.message}
						label="Guardar reglamento"
						onClick={handleSave}
					/>
				</div>
			</div>
		</div>
	);
}
