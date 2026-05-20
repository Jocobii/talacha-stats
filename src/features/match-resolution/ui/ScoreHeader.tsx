"use client";
/**
 * features/match-resolution/ui/ScoreHeader.tsx
 * Cabecera con marcador editable, pills informativos, status y botón de guardado.
 */
import { Save } from "lucide-react";
import { StatusDropdown } from "./StatusDropdown";
import type { MatchResolutionData } from "@/entities/match/model";
import type { ResolutionState, SaveStatus } from "../types";
import type { ResolutionStatus } from "@/db/schema";

type Props = {
	data: MatchResolutionData;
	state: ResolutionState;
	saveStatus: SaveStatus;
	lastSavedAt: Date | null;
	onScoreChange: (side: "home" | "away", value: number | null) => void;
	onStatusChange: (status: ResolutionStatus) => void;
	onSaveNext: () => void;
};

function formatTime(date: Date): string {
	return date.toLocaleTimeString("es-MX", {
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
	});
}

export function ScoreHeader({
	data,
	state,
	saveStatus,
	lastSavedAt,
	onScoreChange,
	onStatusChange,
	onSaveNext,
}: Props) {
	const isLocked =
		state.status === "walkover_home" ||
		state.status === "walkover_away" ||
		state.status === "suspended" ||
		state.status === "postponed";

	return (
		<header className="bg-surface border-b border-line px-4 py-3 sticky top-0 z-20">
			<div className="flex items-center gap-4 flex-wrap">
				{/* Pills informativos */}
				<div className="flex gap-2 flex-wrap text-xs">
					<span className="bg-surface-2 text-ink-2 px-2 py-1 rounded font-medium border border-line">
						{data.league.name}
					</span>
					{data.matchday && (
						<span className="bg-surface-2 text-ink-2 px-2 py-1 rounded border border-line">
							J{data.matchday.number}
						</span>
					)}
					<span className="bg-surface-2 text-ink-2 px-2 py-1 rounded border border-line">
						{data.match.matchDate}
					</span>
					{data.match.cedula && (
						<span className="bg-blue/10 text-blue px-2 py-1 rounded font-mono font-semibold border border-blue/20">
							{data.match.cedula}
						</span>
					)}
				</div>

				{/* Marcador */}
				<div className="flex items-center gap-3 mx-auto">
					<span className="text-sm font-semibold text-blue max-w-[120px] truncate">
						{data.homeTeam.name}
					</span>
					<ScoreInput
						value={state.homeScore}
						onChange={(v) => onScoreChange("home", v)}
						disabled={isLocked}
						color="blue"
					/>
					<span className="text-xl font-bold text-ink-3">–</span>
					<ScoreInput
						value={state.awayScore}
						onChange={(v) => onScoreChange("away", v)}
						disabled={isLocked}
						color="rose"
					/>
					<span className="text-sm font-semibold text-rose max-w-[120px] truncate">
						{data.awayTeam.name}
					</span>
				</div>

				{/* Status + Guardar */}
				<div className="flex items-center gap-2 ml-auto">
					<StatusDropdown value={state.status} onChange={onStatusChange} />
					<button
						onClick={onSaveNext}
						className="flex items-center gap-1.5 bg-brand hover:bg-brand-dim text-pitch text-sm font-bold px-3 py-1.5 rounded transition-colors"
					>
						<Save size={14} />
						Guardar y siguiente
					</button>
				</div>
			</div>

			{/* Indicador de autosave */}
			<div className="mt-1 text-xs text-ink-3 text-right h-4">
				{saveStatus === "saving" && "Guardando…"}
				{saveStatus === "saved" && lastSavedAt && `Guardado a las ${formatTime(lastSavedAt)}`}
				{saveStatus === "error" && (
					<span className="text-rose">Error al guardar — revisa tu conexión</span>
				)}
			</div>
		</header>
	);
}

type ScoreInputProps = {
	value: number | null;
	onChange: (v: number | null) => void;
	disabled: boolean;
	color: "blue" | "rose";
};

function ScoreInput({ value, onChange, disabled, color }: ScoreInputProps) {
	const ring =
		color === "blue"
			? "border-blue/50 focus:ring-blue/30 text-blue"
			: "border-rose/50 focus:ring-rose/30 text-rose";
	return (
		<input
			type="number"
			min={0}
			max={99}
			value={value ?? ""}
			onChange={(e) => {
				const v = e.target.value === "" ? null : parseInt(e.target.value, 10);
				onChange(isNaN(v as number) ? null : v);
			}}
			disabled={disabled}
			inputMode="numeric"
			className={`w-12 text-center text-2xl font-bold bg-surface-2 border rounded px-1 py-0.5 focus:outline-none focus:ring-2 disabled:opacity-40 ${ring}`}
		/>
	);
}
