"use client";
/**
 * features/match-resolution/ui/PlayerStatRow.tsx
 * Fila de stats por jugador con inputs numéricos compactos.
 * Navegación Tab: goals → AM → AZ → RO → asist → siguiente jugador.
 */
import { useState } from "react";
import type { PlayerStatDraft } from "../types";

type StatField = "goals" | "yellowCards" | "blueCards" | "redCards" | "assists";

type Props = {
	player: PlayerStatDraft;
	disabled: boolean;
	onStatChange: (field: StatField | "isPresent" | "shirtNumber", value: number | boolean) => void;
};

const MAX: Record<StatField, number> = {
	goals: 20,
	yellowCards: 3,
	blueCards: 3,
	redCards: 1,
	assists: 20,
};

export function PlayerStatRow({ player, disabled, onStatChange }: Props) {
	const [confirmClear, setConfirmClear] = useState(false);

	const hasStats =
		player.goals + player.assists + player.yellowCards + player.blueCards + player.redCards > 0;

	const handlePresentToggle = () => {
		if (player.isPresent && hasStats) {
			setConfirmClear(true);
		} else {
			onStatChange("isPresent", !player.isPresent);
		}
	};

	const handleClear = () => {
		onStatChange("isPresent", false);
		(["goals", "yellowCards", "blueCards", "redCards", "assists"] as StatField[]).forEach((f) =>
			onStatChange(f, 0),
		);
		setConfirmClear(false);
	};

	return (
		<>
			<tr
				className={`border-b border-line hover:bg-surface-2 transition-colors ${
					player.isAdHoc ? "border-l-2 border-l-amber" : ""
				}`}
			>
				{/* Dorsal */}
				<td className="px-2 py-1 text-center w-10">
					<span className={`text-xs font-mono ${player.isAdHoc ? "text-amber" : "text-ink-3"}`}>
						{player.jerseyNumber ?? "—"}
					</span>
				</td>

				{/* Jugador */}
				<td className="px-2 py-1 min-w-[120px]">
					<span className="text-sm text-ink truncate block max-w-[160px]" title={player.fullName}>
						{player.fullName}
					</span>
					{player.isAdHoc && (
						<span className="text-[10px] text-amber font-medium">Sin verificar</span>
					)}
				</td>

				{/* Stats */}
				{(["goals", "yellowCards", "blueCards", "redCards", "assists"] as StatField[]).map(
					(field) => (
						<td key={field} className="px-1 py-1 text-center w-10">
							<input
								type="number"
								min={0}
								max={MAX[field]}
								value={player[field]}
								disabled={disabled || !player.isPresent}
								inputMode="numeric"
								data-stat-input
								onChange={(e) => {
									const v = Math.min(MAX[field], Math.max(0, parseInt(e.target.value, 10) || 0));
									onStatChange(field, v);
								}}
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										e.preventDefault();
										const inputs = Array.from(
											document.querySelectorAll<HTMLInputElement>(
												"[data-stat-input]:not([disabled])",
											),
										);
										const idx = inputs.indexOf(e.currentTarget);
										inputs[idx + 1]?.focus();
									}
								}}
								className="w-9 text-center text-sm bg-surface-2 border border-line text-ink rounded focus:outline-none focus:ring-1 focus:ring-brand/40 disabled:opacity-30"
							/>
						</td>
					),
				)}

				{/* Presente */}
				<td className="px-2 py-1 text-center w-10">
					<input
						type="checkbox"
						checked={player.isPresent}
						onChange={handlePresentToggle}
						disabled={disabled}
						className="w-4 h-4 accent-brand"
					/>
				</td>
			</tr>

			{/* Confirmación limpiar */}
			{confirmClear && (
				<tr>
					<td colSpan={8}>
						<div className="bg-amber/10 border border-amber/30 rounded px-3 py-2 my-1 flex items-center justify-between gap-2 text-sm text-ink">
							<span>¿Limpiar estadísticas de {player.fullName}?</span>
							<div className="flex gap-2">
								<button
									onClick={() => setConfirmClear(false)}
									className="text-ink-2 underline text-xs"
								>
									Cancelar
								</button>
								<button
									onClick={handleClear}
									className="bg-amber text-pitch px-2 py-0.5 rounded text-xs font-semibold"
								>
									Limpiar
								</button>
							</div>
						</div>
					</td>
				</tr>
			)}
		</>
	);
}
