"use client";

/**
 * shared/ui/ConfirmDialog.tsx
 * Modal de confirmacion para acciones destructivas.
 * Con dangerInput: el usuario debe escribir un texto especifico para habilitar el boton.
 */

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { Input } from "./Input";

type Props = {
	title: string;
	description: string;
	/** Si se proporciona, el usuario debe escribir este texto exacto para confirmar. */
	dangerInput?: string;
	confirmLabel?: string;
	onConfirm: () => void | Promise<void>;
	onClose: () => void;
	loading?: boolean;
};

export function ConfirmDialog({
	title,
	description,
	dangerInput,
	confirmLabel = "Confirmar",
	onConfirm,
	onClose,
	loading = false,
}: Props) {
	const [inputValue, setInputValue] = useState("");
	const isConfirmDisabled = dangerInput ? inputValue !== dangerInput : false;

	async function handleConfirm() {
		if (isConfirmDisabled) return;
		await onConfirm();
	}

	return (
		<Modal onClose={onClose} size="sm">
			<div className="p-6 flex flex-col gap-5">
				<div className="flex items-start gap-3">
					<span className="w-9 h-9 rounded-full bg-red-500/15 border border-red-500/30 grid place-items-center shrink-0 mt-0.5">
						<AlertTriangle size={17} strokeWidth={2} className="text-red-400" />
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
						variant="danger"
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
