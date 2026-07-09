"use client";

/**
 * features/onboarding-wizard/ui/OrgSlugField.tsx
 * Campo de slug con feedback en vivo de disponibilidad (check/cruz/spinner).
 * Componente tonto: recibe status + callbacks, cero fetch (§7.3).
 */

import { Check, X, Loader2 } from "lucide-react";
import { Field } from "@/shared/ui/Field";
import type { SlugCheckStatus } from "../types";

type Props = {
	value: string;
	onChange: (value: string) => void;
	status: SlugCheckStatus;
	error?: string;
};

const TAKEN_MESSAGE = "Ya existe una organización con esa URL. Elige otra.";

export function OrgSlugField({ value, onChange, status, error }: Props) {
	const fieldError = error ?? (status === "taken" ? TAKEN_MESSAGE : undefined);
	const hint = fieldError
		? undefined
		: "Será la dirección de tu sitio (y mañana tu subdominio). Puedes cambiarla después.";

	return (
		<Field label="Tu URL pública" error={fieldError} hint={hint}>
			<div className="flex items-center overflow-hidden rounded-md border border-line bg-surface-2 focus-within:border-brand/60 focus-within:ring-1 focus-within:ring-brand/30">
				<span className="border-r border-line px-3 py-2 text-xs text-ink-3 font-mono whitespace-nowrap">
					talachastats.com/
				</span>
				<input
					value={value}
					onChange={(e) => onChange(e.target.value.toLowerCase())}
					placeholder="mi-liga"
					spellCheck={false}
					autoComplete="off"
					className="flex-1 min-w-0 bg-transparent px-3 py-2 text-sm text-ink placeholder:text-ink-3 outline-none font-mono"
				/>
				<span className="pr-3 shrink-0" aria-hidden={status === "idle" || status === "invalid"}>
					{status === "checking" && (
						<Loader2 size={15} className="animate-spin text-ink-3" strokeWidth={2.5} />
					)}
					{status === "available" && <Check size={15} className="text-brand-ink" strokeWidth={3} />}
					{status === "taken" && <X size={15} className="text-red-400" strokeWidth={3} />}
				</span>
			</div>
		</Field>
	);
}
