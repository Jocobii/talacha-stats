"use client";

/**
 * features/admin-registration/ui/CredentialStep.tsx
 * Pantalla A del paso 3 (docs/CREDENCIAL-PASE-JUGADOR.md): estado de
 * credencial del jugador para la liga elegida. Estados:
 *   A1 vigente     — ya cubierto, solo informa (nunca bloquea el submit).
 *   A2 sin pase    — se emitirá uno al confirmar el registro (misma tx,
 *                    ver features/admin-registration/register.ts). Si la org
 *                    permite ambas modalidades, pide elegir antes de poder
 *                    enviar el formulario.
 * Puramente presentacional — recibe `data` ya resuelto por useCredentialStatus
 * (el caller lo pide una sola vez y también lo usa para deshabilitar el submit).
 */

import { Loader2, ShieldCheck, AlertTriangle } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import type { CredentialStatusResponse, PlayerCredentialScope } from "@/entities/player-credential";

const SCOPE_LABEL: Record<PlayerCredentialScope, string> = {
	single_league: "Pase por liga",
	organization: "Pase anual",
};

type Props = {
	data: CredentialStatusResponse | undefined;
	isLoading: boolean;
	credentialScope: PlayerCredentialScope | null;
	onCredentialScopeChange: (scope: PlayerCredentialScope) => void;
};

export function CredentialStep({
	data,
	isLoading,
	credentialScope,
	onCredentialScopeChange,
}: Props) {
	if (isLoading || !data) {
		return (
			<div className="flex items-center gap-2 text-xs text-ink-3 px-3 py-2.5 rounded-md bg-surface-2 border border-line">
				<Loader2 size={13} className="animate-spin" />
				Revisando credencial…
			</div>
		);
	}

	if (data.displayStatus === "vigente") {
		return (
			<div className="flex items-center gap-2 text-xs text-brand-ink px-3 py-2.5 rounded-md bg-brand/[0.06] border border-brand/20">
				<ShieldCheck size={14} strokeWidth={2} />
				Cuenta con un pase vigente para esta liga.
			</div>
		);
	}

	return (
		<div className="rounded-md bg-amber-500/[0.06] border border-amber-500/20 px-3 py-2.5 space-y-2.5">
			<div className="flex items-center gap-2 text-xs text-amber-300">
				<AlertTriangle size={14} strokeWidth={2} />
				Sin pase vigente — se emitirá uno al confirmar el registro.
			</div>

			{data.scopeOptions.mode === "auto" ? (
				<p className="text-[11px] text-ink-3 pl-[22px]">
					Se emitirá <strong className="text-ink-2">{SCOPE_LABEL[data.scopeOptions.scope]}</strong>{" "}
					automáticamente (config. de la organización).
				</p>
			) : (
				<div className="pl-[22px] space-y-1.5">
					<p className="text-[11px] text-ink-3">Elige qué modalidad emitir:</p>
					<div className="flex gap-2">
						{data.scopeOptions.allowedScopes.map((scope) => (
							<button
								key={scope}
								type="button"
								onClick={() => onCredentialScopeChange(scope)}
								className={cn(
									"flex-1 text-left px-3 py-2 rounded-md border text-[12px] font-medium transition",
									credentialScope === scope
										? "border-brand/60 bg-brand/[0.08] text-brand-ink"
										: "border-line bg-surface-2 text-ink-2 hover:border-ink-3",
								)}
							>
								{SCOPE_LABEL[scope]}
							</button>
						))}
					</div>
				</div>
			)}
		</div>
	);
}

/**
 * ¿El submit debe quedar deshabilitado por falta de decisión de credencial?
 * Solo bloquea cuando hay liga elegida, la org permite ambas modalidades, y
 * el usuario todavía no eligió cuál (previene el 422 SCOPE_SELECTION_REQUIRED
 * del backend en vez de solo mostrarlo tras el intento fallido).
 */
export function isCredentialChoicePending(
	leagueId: string,
	data: CredentialStatusResponse | undefined,
	credentialScope: PlayerCredentialScope | null,
): boolean {
	if (!leagueId || !data) return false;
	if (data.displayStatus === "vigente") return false;
	return data.scopeOptions.mode === "choice" && !credentialScope;
}
