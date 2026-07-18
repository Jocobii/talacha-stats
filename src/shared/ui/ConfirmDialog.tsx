"use client";

/**
 * shared/ui/ConfirmDialog.tsx
 * Modal de confirmacion generico. Dos tonos:
 *  - "danger" (default): accion destructiva — icono de alerta rojo, boton danger.
 *    Con dangerInput: el usuario debe escribir un texto especifico para habilitar el boton.
 *  - "brand": accion positiva/celebratoria (ej. iniciar la fase final) — icono
 *    verde de marca (Trophy por default, o el que pase `icon`), boton primary.
 *    No soporta dangerInput (no tiene sentido pedir confirmacion escrita para
 *    algo no destructivo).
 */

import { useState } from "react";
import type { ComponentType } from "react";
import { AlertTriangle, Trophy } from "lucide-react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { Input } from "./Input";

type IconC = ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;

type Props = {
	title: string;
	description: string;
	/** Si se proporciona, el usuario debe escribir este texto exacto para confirmar. Solo aplica con tone="danger". */
	dangerInput?: string;
	confirmLabel?: string;
	onConfirm: () => void | Promise<void>;
	onClose: () => void;
	loading?: boolean;
	/** "danger" (default) para acciones destructivas, "brand" para acciones positivas/celebratorias. */
	tone?: "danger" | "brand";
	/** Icono del encabezado. Default: AlertTriangle (danger) / Trophy (brand). */
	icon?: IconC;
};

export function ConfirmDialog({
	title,
	description,
	dangerInput,
	confirmLabel = "Confirmar",
	onConfirm,
	onClose,
	loading = false,
	tone = "danger",
	icon,
}: Props) {
	const [inputValue, setInputValue] = useState("");
	const isConfirmDisabled = dangerInput ? inputValue !== dangerInput : false;
	const Icon = icon ?? (tone === "brand" ? Trophy : AlertTriangle);

	async function handleConfirm() {
		if (isConfirmDisabled) return;
		await onConfirm();
	}

	return (
		<Modal onClose={onClose} size="sm">
			<div className="p-6 flex flex-col gap-5">
				<div className="flex items-start gap-3">
					<span
						className={
							tone === "brand"
								? "w-9 h-9 rounded-full bg-brand/15 border border-brand/30 grid place-items-center shrink-0 mt-0.5"
								: "w-9 h-9 rounded-full bg-red-500/15 border border-red-500/30 grid place-items-center shrink-0 mt-0.5"
						}
					>
						<Icon
							size={17}
							strokeWidth={2}
							className={tone === "brand" ? "text-brand-ink" : "text-red-400"}
						/>
					</span>
					<div>
						<h3 className="text-[15px] font-semibold text-ink">{title}</h3>
						<p className="text-[13px] text-ink-2 mt-1 leading-relaxed">{description}</p>
					</div>
				</div>

				{dangerInput && (
					<div>
						<p className="text-[12px] text-ink-2 mb-2">
							Para confirmar, escribe <strong className="text-ink font-mono">{dangerInput}</strong>{" "}
							a continuacion:
						</p>
						<Input
							value={inputValue}
							onChange={(e) => setInputValue(e.target.value)}
							placeholder={dangerInput}
							autoFocus
							onKeyDown={(e) => {
								if (e.key === "Enter" && !isConfirmDisabled) handleConfirm();
							}}
						/>
					</div>
				)}

				<div className="flex gap-2 justify-end">
					<Button variant="ghost" size="md" onClick={onClose} disabled={loading}>
						Cancelar
					</Button>
					<Button
						variant={tone === "brand" ? "primary" : "danger"}
						size="md"
						onClick={handleConfirm}
						disabled={isConfirmDisabled || loading}
					>
						{loading ? "Procesando..." : confirmLabel}
					</Button>
				</div>
			</div>
		</Modal>
	);
}
