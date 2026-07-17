"use client";

/**
 * features/player-credential/ui/IssueCredentialModal.tsx
 *
 * Modal "Emitir / renovar pase" (docs/CREDENCIAL-PASE-JUGADOR.md, pantalla B)
 * — usado fuera del flujo de registro: tabla de jugadores (pantalla C) y
 * perfil del jugador (pantalla D), donde el pase se emite/renueva sin volver
 * a pasar por el registro. Requiere un leagueId (el server deriva la
 * organización de ahí) — para pase `organization` cualquier liga de la
 * organización sirve, no necesita ser la liga a renovar.
 */

import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { Modal } from "@/shared/ui/Modal";
import { Button } from "@/shared/ui/Button";
import { SaveButton } from "@/shared/ui/SaveButton";
import { cn } from "@/shared/lib/cn";
import { notify } from "@/shared/lib/notify";
import type { OrganizationCredentialConfigDto } from "@/entities/organization-credential-config";
import type { CredentialDisplayStatus, PlayerCredentialScope } from "@/entities/player-credential";
import { useIssueCredential } from "../model/useIssueCredential";

const SCOPE_LABEL: Record<PlayerCredentialScope, { title: string; hint: string }> = {
	single_league: { title: "Pase por liga", hint: "Solo válido para esta liga" },
	organization: { title: "Pase anual", hint: "Válido en toda la organización por 1 año" },
};

type Props = {
	onClose: () => void;
	globalPlayerId: string;
	leagueId: string;
	playerName: string;
	orgConfig: OrganizationCredentialConfigDto;
	currentDisplayStatus?: CredentialDisplayStatus;
	/** Se llama tras emitir con éxito — el caller decide cómo refrescar (router.refresh()). */
	onIssued?: () => void;
};

function allowedScopesFrom(config: OrganizationCredentialConfigDto): PlayerCredentialScope[] {
	return [
		...(config.allowSingleLeaguePass ? (["single_league"] as const) : []),
		...(config.allowOrganizationPass ? (["organization"] as const) : []),
	];
}

export function IssueCredentialModal({
	onClose,
	globalPlayerId,
	leagueId,
	playerName,
	orgConfig,
	currentDisplayStatus,
	onIssued,
}: Props) {
	const allowedScopes = allowedScopesFrom(orgConfig);
	const [scope, setScope] = useState<PlayerCredentialScope | null>(
		allowedScopes.length === 1 ? allowedScopes[0]! : null,
	);
	const mutation = useIssueCredential();

	const isRenewal = currentDisplayStatus === "vencida" || currentDisplayStatus === "porvencer";
	const title = isRenewal ? "Renovar pase" : "Emitir pase";

	function handleSubmit() {
		if (!scope) return;
		mutation.mutate(
			{ globalPlayerId, leagueId, scope },
			{
				onSuccess: () => {
					notify.success(isRenewal ? "Pase renovado" : "Pase emitido");
					onIssued?.();
					onClose();
				},
				onError: (error) => {
					notify.error(error.message || "No se pudo emitir el pase");
				},
			},
		);
	}

	return (
		<Modal onClose={onClose} title={title} size="sm">
			<div className="p-5 space-y-4">
				<p className="text-sm text-ink-2">
					{playerName} —{" "}
					{isRenewal
						? "su pase anterior venció o está por vencer."
						: "aún no tiene un pase vigente."}
				</p>

				{allowedScopes.length > 1 ? (
					<div className="space-y-2">
						<p className="text-xs font-medium text-ink-2">Modalidad</p>
						<div className="flex flex-col gap-2">
							{allowedScopes.map((s) => (
								<button
									key={s}
									type="button"
									onClick={() => setScope(s)}
									className={cn(
										"text-left px-3.5 py-2.5 rounded-md border transition",
										scope === s
											? "border-brand/60 bg-brand/[0.08]"
											: "border-line bg-surface-2 hover:border-ink-3",
									)}
								>
									<p className="text-[13px] font-semibold text-ink">{SCOPE_LABEL[s].title}</p>
									<p className="text-[11px] text-ink-3 mt-0.5">{SCOPE_LABEL[s].hint}</p>
								</button>
							))}
						</div>
					</div>
				) : (
					scope && (
						<div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-md bg-surface-2 border border-line">
							<ShieldCheck size={16} strokeWidth={2} className="text-brand-ink shrink-0" />
							<div>
								<p className="text-[13px] font-semibold text-ink">{SCOPE_LABEL[scope].title}</p>
								<p className="text-[11px] text-ink-3">
									Automático · configuración de la organización
								</p>
							</div>
						</div>
					)
				)}

				{mutation.error && (
					<p className="text-xs text-red-400 bg-red-900/20 border border-red-800/30 rounded-md px-3 py-2">
						{mutation.error.message}
					</p>
				)}

				<div className="flex items-center justify-end gap-2.5 pt-2">
					<Button variant="secondary" size="md" onClick={onClose} disabled={mutation.isPending}>
						Cancelar
					</Button>
					<SaveButton
						status={mutation.isPending ? "pending" : "idle"}
						label={isRenewal ? "Renovar" : "Emitir"}
						pendingLabel="Emitiendo…"
						onClick={handleSubmit}
						disabled={!scope || mutation.isPending}
					/>
				</div>
			</div>
		</Modal>
	);
}
