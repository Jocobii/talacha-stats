"use client";

/**
 * shared/ui/SaveButton.tsx
 *
 * Botón de guardado compartido: loading + feedback INLINE (no depende solo
 * del toast). Se detectó que el toast (sileo) no estaba dando señal visible
 * de forma confiable en los tabs del hub de organización — este componente
 * asegura que el usuario siempre vea algo junto al botón, sea cual sea la
 * causa de fondo. Úsalo en toda acción de guardar en vez de un <button> a mano.
 */

import { Check, AlertCircle } from "lucide-react";
import { Button, type ButtonProps } from "./Button";

export type SaveStatus = "idle" | "pending" | "success" | "error";

type Props = Omit<ButtonProps, "loading" | "children"> & {
	status: SaveStatus;
	errorMessage?: string | null;
	label?: string;
	pendingLabel?: string;
	successLabel?: string;
};

export function SaveButton({
	status,
	errorMessage,
	label = "Guardar",
	pendingLabel = "Guardando…",
	successLabel = "Guardado",
	...buttonProps
}: Props) {
	return (
		<div className="flex items-center gap-3">
			{status === "success" && (
				<span className="flex items-center gap-1.5 text-[13px] font-medium text-brand-ink">
					<Check size={14} strokeWidth={2.5} />
					{successLabel}
				</span>
			)}
			{status === "error" && (
				<span className="flex items-center gap-1.5 text-[13px] font-medium text-red-400">
					<AlertCircle size={14} strokeWidth={2} />
					{errorMessage || "No se pudo guardar. Intenta de nuevo."}
				</span>
			)}
			<Button loading={status === "pending"} {...buttonProps}>
				{status === "pending" ? pendingLabel : label}
			</Button>
		</div>
	);
}
