"use client";
/**
 * features/match-resolution/ui/StatusDropdown.tsx
 * Selector de estado del partido con confirmaciones para acciones destructivas.
 */
import { useState } from "react";
import { STATUS_LABELS, CLEAR_STATS_STATUSES } from "../constants";
import type { ResolutionStatus } from "@/db/schema";

const RESOLUTION_STATUS_OPTIONS: ResolutionStatus[] = [
	"played",
	"scheduled",
	"suspended",
	"postponed",
	"walkover_home",
	"walkover_away",
];

type Props = {
	value: string;
	onChange: (status: ResolutionStatus) => void;
	disabled?: boolean;
};

const CLEAR_CONFIRM =
	"Esto borrará las estadísticas capturadas. El partido quedará disponible para reprogramar. ¿Continuar?";

export function StatusDropdown({ value, onChange, disabled }: Props) {
	const [pendingStatus, setPendingStatus] = useState<ResolutionStatus | null>(null);

	const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const next = e.target.value as ResolutionStatus;
		const isDestructive = (CLEAR_STATS_STATUSES as readonly string[]).includes(next);

		if (isDestructive) {
			setPendingStatus(next);
		} else {
			onChange(next);
		}
	};

	const confirmChange = () => {
		if (pendingStatus) {
			onChange(pendingStatus);
			setPendingStatus(null);
		}
	};

	return (
		<>
			<select
				value={value}
				onChange={handleChange}
				disabled={disabled}
				className="text-sm bg-surface-2 border border-line text-ink rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-brand/30 disabled:opacity-50"
			>
				{RESOLUTION_STATUS_OPTIONS.map((s) => (
					<option key={s} value={s}>
						{STATUS_LABELS[s]}
					</option>
				))}
			</select>

			{pendingStatus && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
					<div className="bg-surface border border-line rounded-lg p-6 max-w-sm w-full shadow-2xl mx-4">
						<p className="text-sm text-ink-2 mb-4">{CLEAR_CONFIRM}</p>
						<div className="flex gap-2 justify-end">
							<button
								onClick={() => setPendingStatus(null)}
								className="px-3 py-1.5 text-sm text-ink-2 border border-line rounded hover:bg-surface-2 transition-colors"
							>
								Cancelar
							</button>
							<button
								onClick={confirmChange}
								className="px-3 py-1.5 text-sm bg-rose hover:opacity-90 text-white font-semibold rounded transition-opacity"
							>
								Confirmar
							</button>
						</div>
					</div>
				</div>
			)}
		</>
	);
}
