"use client";

/**
 * features/organization-credential-config/ui/CredencialesTab.tsx
 * Orquestador del tab Credenciales del hub de organización — calco de
 * organization-rules/ui/ReglamentoTab.tsx, reusando SectionCard/FieldRow de
 * tournament-rules/ui/primitives (mismo patrón que ReglamentoTab).
 */
import { useState } from "react";
import type {
	OrganizationCredentialConfigDto,
	UpdateOrganizationCredentialConfigInput,
} from "@/entities/organization-credential-config";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import { SaveButton } from "@/shared/ui/SaveButton";
import { SectionCard, FieldRow } from "@/features/tournament-rules/ui/primitives";
import { cn } from "@/shared/lib/cn";
import { useOrgCredentialConfig } from "../model/useOrgCredentialConfig";
import { useUpdateOrgCredentialConfig } from "../model/useUpdateOrgCredentialConfig";

type Props = {
	organizationId: string;
	initialConfig: OrganizationCredentialConfigDto;
};

function Switch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
	return (
		<button
			type="button"
			role="switch"
			aria-checked={checked}
			onClick={() => onChange(!checked)}
			className={cn(
				"w-9 h-5 rounded-full relative transition shrink-0",
				checked ? "bg-brand" : "bg-ink-3/40",
			)}
		>
			<span
				className={cn(
					"absolute top-[2px] w-4 h-4 rounded-full bg-white transition-all",
					checked ? "left-[18px]" : "left-[2px]",
				)}
			/>
		</button>
	);
}

function modeLabel(
	cfg: Pick<OrganizationCredentialConfigDto, "allowSingleLeaguePass" | "allowOrganizationPass">,
): string {
	if (cfg.allowSingleLeaguePass && cfg.allowOrganizationPass) return "Ambas modalidades";
	if (cfg.allowOrganizationPass) return "Solo pase anual";
	if (cfg.allowSingleLeaguePass) return "Solo pase por liga";
	return "Ninguna — inválido";
}

export function CredencialesTab({ organizationId, initialConfig }: Props) {
	const { data: saved } = useOrgCredentialConfig(organizationId, initialConfig);
	const mutation = useUpdateOrgCredentialConfig(organizationId);
	const [draft, setDraft] = useState<OrganizationCredentialConfigDto>(saved);

	const patch = (fields: Partial<UpdateOrganizationCredentialConfigInput>) =>
		setDraft((d) => ({ ...d, ...fields }));
	const handleDiscard = () => setDraft(saved);
	const handleSave = () =>
		mutation.mutate(
			{
				allowSingleLeaguePass: draft.allowSingleLeaguePass,
				allowOrganizationPass: draft.allowOrganizationPass,
			},
			{ onSuccess: (config) => setDraft(config) },
		);

	const bothOff = !draft.allowSingleLeaguePass && !draft.allowOrganizationPass;

	return (
		<div className="flex flex-col gap-5">
			<div className="flex items-start gap-2.5 bg-surface-2 border border-line rounded-lg px-4 py-3">
				<p className="text-[12.5px] text-ink-2 leading-snug">
					Define qué modalidad(es) de pase puede emitir tu organización. Si permites ambas, quien
					registre o emita el pase elige cuál usar; si solo permites una, se aplica automáticamente
					sin preguntar.
				</p>
			</div>

			<SectionCard title="Modalidades de pase">
				<FieldRow
					label="Pase por liga"
					hint="Válido solo para la liga donde se emitió — se vuelve a emitir por cada liga nueva."
				>
					<Switch
						checked={draft.allowSingleLeaguePass}
						onChange={(v) => patch({ allowSingleLeaguePass: v })}
					/>
				</FieldRow>
				<FieldRow
					label="Pase anual"
					hint="Válido en toda la organización durante 1 año desde su emisión."
					isDefault
				>
					<Switch
						checked={draft.allowOrganizationPass}
						onChange={(v) => patch({ allowOrganizationPass: v })}
					/>
				</FieldRow>
			</SectionCard>

			<div className="flex items-center justify-between bg-surface-2 border border-line rounded-lg px-4 py-3">
				<span className="text-[12.5px] text-ink-2">Modo actual</span>
				<Badge tone={bothOff ? "danger" : "brand"}>{modeLabel(draft)}</Badge>
			</div>
			{bothOff && (
				<p className="text-xs text-red-400 -mt-3">
					Debes permitir al menos una modalidad antes de guardar.
				</p>
			)}

			<div className="sticky bottom-0 z-40 bg-surface/95 backdrop-blur border-t border-line rounded-t-xl">
				<div className="px-5 py-4 flex items-center justify-end gap-2.5">
					<span className="text-[13px] text-ink-3 mr-auto">
						Aplica a los pases que se emitan a partir de ahora.
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
						label="Guardar cambios"
						onClick={handleSave}
						disabled={bothOff}
					/>
				</div>
			</div>
		</div>
	);
}
