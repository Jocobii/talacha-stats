"use client";

/**
 * features/organization-scheduling/ui/SorteoTab.tsx
 * Tab Sorteo del hub — el hueco principal (docs/ORG-PROFILE-HUB.md Épica Q):
 * antes de esto no existía ninguna plantilla de sorteo a nivel organización.
 * Réplica del formulario "Parámetros del sorteo" de liga, reusando
 * NumInput/ToggleSwitch/SectionCard/FieldRow de tournament-rules/ui.
 */
import { useState } from "react";
import type { UpdateOrganizationSchedulingConfigInput } from "@/entities/organization-scheduling-config";
import { Button } from "@/shared/ui/Button";
import { SaveButton } from "@/shared/ui/SaveButton";
import { NumInput, ToggleSwitch } from "@/features/tournament-rules/ui/controls";
import { FieldRow, SectionCard } from "@/features/tournament-rules/ui/primitives";
import { useOrganizationSchedulingConfig } from "../model/useOrganizationSchedulingConfig";
import { useUpdateOrganizationSchedulingConfig } from "../model/useUpdateOrganizationSchedulingConfig";
import { OptionalNumInput } from "./OptionalNumInput";
import type { OrganizationSchedulingConfigDto } from "@/entities/organization-scheduling-config";

type Props = {
	organizationId: string;
	initialData: OrganizationSchedulingConfigDto;
};

function toUpdateInput(
	draft: OrganizationSchedulingConfigDto,
): UpdateOrganizationSchedulingConfigInput {
	return {
		regularMatchdays: draft.regularMatchdays,
		regularFormat: draft.regularFormat as "single" | "double",
		matchDurationMinutes: draft.matchDurationMinutes,
		bufferMinutes: draft.bufferMinutes,
		allowDuplicateMatchups: draft.allowDuplicateMatchups,
		noRepeatWithin: draft.noRepeatWithin,
	};
}

export function SorteoTab({ organizationId, initialData }: Props) {
	const { data: saved } = useOrganizationSchedulingConfig(organizationId, initialData);
	const mutation = useUpdateOrganizationSchedulingConfig(organizationId);
	const [draft, setDraft] = useState<OrganizationSchedulingConfigDto>(saved);

	const patch = (fields: Partial<OrganizationSchedulingConfigDto>) =>
		setDraft((d) => ({ ...d, ...fields }));
	const handleDiscard = () => setDraft(saved);
	const handleSave = () =>
		mutation.mutate(toUpdateInput(draft), { onSuccess: (data) => setDraft(data) });

	return (
		<div className="flex flex-col gap-5">
			<div className="flex items-start gap-2.5 bg-surface-2 border border-line rounded-lg px-4 py-3">
				<p className="text-[12.5px] text-ink-2 leading-snug">
					Estos valores se copian a cada liga nueva al momento de crearla. No afectan ligas ya
					creadas.
				</p>
			</div>

			<SectionCard title="Parámetros del sorteo">
				<FieldRow
					label="Duración del partido"
					hint="Tiempo total del partido, incluyendo medio tiempo."
					isDefault={draft.matchDurationMinutes === 50}
				>
					<NumInput
						value={draft.matchDurationMinutes}
						onChange={(v) => patch({ matchDurationMinutes: v })}
						suffix="min"
					/>
				</FieldRow>
				<FieldRow
					label="Buffer entre partidos"
					hint="Tiempo de transición entre dos partidos en la misma cancha."
					isDefault={draft.bufferMinutes === 0}
				>
					<NumInput
						value={draft.bufferMinutes}
						onChange={(v) => patch({ bufferMinutes: v })}
						suffix="min"
					/>
				</FieldRow>
				<FieldRow
					label="Sin repetir rival en"
					hint="El sorteo evitará enfrentar a los mismos dos equipos dentro de esta ventana."
					isDefault={draft.noRepeatWithin === 3}
				>
					<NumInput
						value={draft.noRepeatWithin}
						onChange={(v) => patch({ noRepeatWithin: v })}
						suffix="jornadas"
					/>
				</FieldRow>
				<FieldRow
					label="Jornadas regulares"
					hint="Cuántas jornadas tiene la temporada antes de playoffs. Vacío = automático por nº de equipos."
					isDefault={draft.regularMatchdays === null}
				>
					<OptionalNumInput
						value={draft.regularMatchdays}
						onChange={(v) => patch({ regularMatchdays: v })}
						placeholder="Automático"
						suffix="jornadas"
					/>
				</FieldRow>
				<FieldRow
					label="Permitir rivales repetidos"
					hint="Ignora el límite de jornadas según el número de equipos."
					isDefault={draft.allowDuplicateMatchups === false}
				>
					<ToggleSwitch
						checked={draft.allowDuplicateMatchups}
						onChange={(v) => patch({ allowDuplicateMatchups: v })}
					/>
				</FieldRow>
			</SectionCard>

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
						label="Guardar sorteo"
						onClick={handleSave}
					/>
				</div>
			</div>
		</div>
	);
}
