"use client";
/**
 * features/match-resolution/ui/PlayerStatRow.tsx
 * Fila de stats por jugador con inputs numéricos compactos.
 * Captura estilo Excel: click en una celda + flechas navegan (↑↓←→) y Enter
 * baja una fila en la misma columna. No requiere marcar "presente" primero:
 * escribir cualquier stat > 0 marca al jugador presente automáticamente
 * (ver use-match-resolution.ts).
 */
import { useState } from "react";
// Ruta completa (no el barrel "@/entities/player"): el barrel también
// re-exporta queries.ts, que importa "@/db" (pg) — inaceptable en un Client
// Component, rompe el bundle de browser (dns/fs/net). credential.ts es puro.
import { formatCredentialCode } from "@/entities/player/lib/credential";
import { notify } from "@/shared/lib/notify";
import { moveGridFocus } from "../lib/grid-nav";
import type { PlayerStatDraft, TeamSide } from "../types";

type StatField = "goals" | "yellowCards" | "blueCards" | "redCards" | "assists";

type Props = {
	side: TeamSide;
	rowIndex: number;
	rowCount: number;
	player: PlayerStatDraft;
	disabled: boolean;
	/** true en cualquier W.O.: bloquea SOLO la celda de goles (con error al intentar). */
	goalsLocked: boolean;
	onStatChange: (field: StatField | "isPresent" | "shirtNumber", value: number | boolean) => void;
};

const GOALS_LOCKED_MESSAGE =
	'En W.O. los goles van a "Goles de equipo" — no se capturan por jugador';

const STAT_FIELDS: StatField[] = ["goals", "yellowCards", "blueCards", "redCards", "assists"];
/** Columna del checkbox "presente" en la grilla (tras las 5 columnas de stats). */
const PRESENT_COL = STAT_FIELDS.length;

const MAX: Record<StatField, number> = {
	goals: 20,
	yellowCards: 3,
	blueCards: 3,
	redCards: 1,
	assists: 20,
};

export function PlayerStatRow({
	side,
	rowIndex,
	rowCount,
	player,
	disabled,
	goalsLocked,
	onStatChange,
}: Props) {
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
				{/* Código de credencial — mismo orden y formato que la cédula impresa */}
				<td className="px-2 py-1 text-center w-14">
					<span className="text-xs font-mono font-semibold text-ink-2">
						{formatCredentialCode(player.credentialCode)}
					</span>
				</td>

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
				{STAT_FIELDS.map((field, colIndex) => {
					// Bloqueo específico de "goles" en W.O.: la fila sigue habilitada
					// (asistencia/tarjetas se capturan normal), pero el marcador ya se
					// atribuye completo a "goles de equipo" — no se reparte por jugador.
					const isGoalsBlocked = field === "goals" && goalsLocked && !disabled;

					return (
						<td key={field} className="px-1 py-1 text-center w-10">
							<input
								type="number"
								min={0}
								max={MAX[field]}
								value={player[field]}
								disabled={disabled}
								inputMode="numeric"
								data-stat-input
								data-side={side}
								data-row={rowIndex}
								data-col={colIndex}
								data-goals-locked={isGoalsBlocked ? "true" : undefined}
								title={isGoalsBlocked ? GOALS_LOCKED_MESSAGE : undefined}
								onFocus={(e) => {
									if (isGoalsBlocked) {
										notify.error(GOALS_LOCKED_MESSAGE);
										e.currentTarget.blur();
										return;
									}
									e.currentTarget.select();
								}}
								onChange={(e) => {
									if (isGoalsBlocked) return; // defensivo: el focus ya bloquea la edición
									const v = Math.min(MAX[field], Math.max(0, parseInt(e.target.value, 10) || 0));
									onStatChange(field, v);
								}}
								onKeyDown={(e) => moveGridFocus(e, side, rowIndex, colIndex, rowCount)}
								className={`w-9 text-center text-sm bg-surface-2 border border-line text-ink rounded focus:outline-none focus:ring-1 focus:ring-brand/40 disabled:opacity-30 ${
									isGoalsBlocked ? "opacity-50 cursor-not-allowed" : ""
								}`}
							/>
						</td>
					);
				})}

				{/* Presente */}
				<td className="px-2 py-1 text-center w-10">
					<input
						type="checkbox"
						checked={player.isPresent}
						onChange={handlePresentToggle}
						disabled={disabled}
						data-side={side}
						data-row={rowIndex}
						data-col={PRESENT_COL}
						onKeyDown={(e) => moveGridFocus(e, side, rowIndex, PRESENT_COL, rowCount)}
						className="w-4 h-4 accent-brand"
					/>
				</td>
			</tr>

			{/* Confirmación limpiar */}
			{confirmClear && (
				<tr>
					<td colSpan={9}>
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
