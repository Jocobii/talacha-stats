"use client";
/**
 * features/match-resolution/ui/TeamPanel.tsx
 * Panel de un equipo con tabla de jugadores y stats.
 */
import { UserPlus, AlertTriangle } from "lucide-react";
import { PlayerStatRow } from "./PlayerStatRow";
import { BonusGoalsField } from "./BonusGoalsField";
import type { TeamSide, PlayerStatDraft } from "../types";

type Props = {
	side: TeamSide;
	teamName: string;
	players: PlayerStatDraft[];
	/** Marcador global − (goles de jugadores + goles de equipo). 0 = cuadra. */
	goalGap: number;
	bonusGoals: number;
	disabled: boolean;
	/** true en cualquier W.O.: los goles van fijos a "goles de equipo", nunca por jugador. */
	goalsLocked: boolean;
	/** true si este equipo es el que no se presentó en un W.O. (lista bloqueada). */
	absent?: boolean;
	onStatChange: (registrationId: string, field: string, value: number | boolean) => void;
	onBonusChange: (value: number) => void;
	onAddPlayer: () => void;
};

const HEADER_COLOR: Record<TeamSide, string> = {
	home: "bg-blue/15 border-b border-blue/25 text-blue",
	away: "bg-rose/15 border-b border-rose/25 text-rose",
};

export function TeamPanel({
	side,
	teamName,
	players,
	goalGap,
	bonusGoals,
	disabled,
	goalsLocked,
	absent,
	onStatChange,
	onBonusChange,
	onAddPlayer,
}: Props) {
	const totalGoals = players.reduce((s, p) => s + p.goals, 0);

	return (
		<div className="flex flex-col bg-surface border border-line rounded-lg overflow-hidden">
			{/* Header del equipo */}
			<div className={`${HEADER_COLOR[side]} px-3 py-2 flex items-center justify-between`}>
				<span className="flex items-center gap-2 min-w-0">
					<span className="font-semibold text-sm truncate">{teamName}</span>
					{absent && (
						<span className="text-[10px] bg-rose/20 text-rose px-1.5 py-0.5 rounded font-semibold shrink-0">
							No se presentó
						</span>
					)}
				</span>
				<span className="flex items-center gap-2 shrink-0">
					<span className="text-xs opacity-70">{totalGoals} gol(es)</span>
					{goalGap !== 0 && (
						<span
							className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded bg-rose text-white animate-pulse"
							role="alert"
						>
							<AlertTriangle size={12} />
							{goalGap > 0 ? `faltan ${goalGap}` : `sobran ${Math.abs(goalGap)}`}
						</span>
					)}
				</span>
			</div>

			{/* Tabla de jugadores */}
			<div className="overflow-x-auto flex-1">
				<table className="w-full text-sm">
					<thead>
						<tr className="bg-surface-2 text-xs text-ink-3 border-b border-line">
							<th
								className="px-2 py-1 text-center w-14"
								title="Código de credencial (igual que en la cédula impresa)"
							>
								Cód.
							</th>
							<th className="px-2 py-1 text-center w-10">#</th>
							<th className="px-2 py-1 text-left">Jugador</th>
							<th className="px-1 py-1 text-center w-10" title="Goles">
								G
							</th>
							<th className="px-1 py-1 text-center w-10" title="Amarilla">
								AM
							</th>
							<th className="px-1 py-1 text-center w-10" title="Azul">
								AZ
							</th>
							<th className="px-1 py-1 text-center w-10" title="Roja">
								RO
							</th>
							<th className="px-1 py-1 text-center w-10" title="Asistencias">
								Ast
							</th>
							<th className="px-2 py-1 text-center w-10" title="Presente">
								✓
							</th>
						</tr>
					</thead>
					<tbody>
						{players.map((player, rowIndex) => (
							<PlayerStatRow
								key={player.registrationId}
								side={side}
								rowIndex={rowIndex}
								rowCount={players.length}
								player={player}
								disabled={disabled}
								goalsLocked={goalsLocked}
								onStatChange={(field, value) => onStatChange(player.registrationId, field, value)}
							/>
						))}
					</tbody>
				</table>
			</div>

			{/* Footer del panel */}
			<div className="border-t border-line">
				<BonusGoalsField
					value={bonusGoals}
					onChange={onBonusChange}
					disabled={disabled || goalsLocked}
					title={
						goalsLocked
							? "En W.O. el marcador se atribuye completo aquí, no por jugador"
							: undefined
					}
				/>
				<div className="px-3 py-2">
					<button
						onClick={onAddPlayer}
						disabled={disabled}
						className="flex items-center gap-1.5 text-xs text-brand-ink hover:text-brand-dim disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
					>
						<UserPlus size={12} />
						Añadir jugador
					</button>
				</div>
			</div>
		</div>
	);
}
