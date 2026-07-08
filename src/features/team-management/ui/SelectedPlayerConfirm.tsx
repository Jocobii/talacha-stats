"use client";

/**
 * features/team-management/ui/SelectedPlayerConfirm.tsx
 * Paso de confirmación: jugador elegido + dorsal opcional + alta al equipo.
 */

import { ArrowLeft, AlertCircle } from "lucide-react";
import { Avatar } from "@/shared/ui/Avatar";
import { Input } from "@/shared/ui/Input";
import { Field } from "@/shared/ui/Field";
import { Button } from "@/shared/ui/Button";
import type { OrgPlayerSearchResult } from "../types";

type Props = {
	player: OrgPlayerSearchResult;
	dorsal: string;
	onDorsalChange: (v: string) => void;
	onBack: () => void;
	onConfirm: () => void;
	submitting: boolean;
	error: string;
};

function initials(fullName: string): string {
	const parts = fullName.trim().split(/\s+/);
	if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
	return fullName.slice(0, 2).toUpperCase();
}

export function SelectedPlayerConfirm({
	player,
	dorsal,
	onDorsalChange,
	onBack,
	onConfirm,
	submitting,
	error,
}: Props) {
	return (
		<div className="flex flex-col gap-4">
			<button
				type="button"
				onClick={onBack}
				className="self-start inline-flex items-center gap-1.5 text-[13px] text-ink-3 hover:text-ink transition"
			>
				<ArrowLeft size={14} strokeWidth={2} /> Cambiar jugador
			</button>

			<div className="flex items-center gap-3 rounded-lg border border-line bg-surface-2/40 px-4 py-3">
				<Avatar initials={initials(player.fullName)} size="md" />
				<div className="min-w-0">
					<p className="text-[15px] font-medium text-ink truncate">{player.fullName}</p>
					<p className="text-[11px] text-ink-3">{player.birthDate}</p>
				</div>
			</div>

			<Field label="Dorsal" hint="Opcional — puedes asignarlo después.">
				<Input
					type="number"
					min={1}
					max={99}
					value={dorsal}
					onChange={(e) => onDorsalChange(e.target.value)}
					placeholder="Ej. 10"
					className="max-w-[120px]"
				/>
			</Field>

			{error && (
				<p className="text-xs text-red-400 flex items-center gap-1">
					<AlertCircle size={12} strokeWidth={2.25} />
					{error}
				</p>
			)}

			<div className="flex justify-end gap-2 pt-1">
				<Button variant="ghost" onClick={onBack} disabled={submitting}>
					Cancelar
				</Button>
				<Button variant="primary" onClick={onConfirm} disabled={submitting}>
					{submitting ? "Agregando…" : "Agregar al equipo"}
				</Button>
			</div>
		</div>
	);
}
