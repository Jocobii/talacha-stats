"use client";
/**
 * features/match-resolution/ui/ScoreHeader.tsx
 * Cabecera con marcador editable, pills informativos, status y botón de guardado.
 */
import { Save, AlertTriangle, Printer } from "lucide-react";
import { StatusDropdown } from "./StatusDropdown";
import type { MatchResolutionData } from "@/entities/match/model";
import type { ResolutionState, SaveStatus } from "../types";
import type { ResolutionStatus } from "@/db/schema";

type Props = {
	data: MatchResolutionData;
	state: ResolutionState;
	saveStatus: SaveStatus;
	lastSavedAt: Date | null;
	capturedCount: number;
	totalMatches: number;
	matchdayLabel?: string; // overrides "JN" pill (used for playoff rounds)
	hasGoalMismatch: boolean;
	/** Antes solo se podía imprimir la cédula desde la tabla de la jornada — si
	 *  el organizador se queda navegando partido a partido ("Guardar y
	 *  siguiente") nunca vuelve ahí y pierde la opción. Mismo criterio que
	 *  `canPrintCedulas` en jornadas/[matchdayId]/page.tsx (jornada no-draft). */
	canPrintCedula?: boolean;
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
	capturedCount,
	totalMatches,
	matchdayLabel,
	hasGoalMismatch,
	canPrintCedula = false,
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
					{matchdayLabel ? (
						<span className="bg-brand/10 text-brand-ink px-2 py-1 rounded border border-brand/20 font-semibold">
							{matchdayLabel}
						</span>
					) : (
						data.matchday && (
							<span className="bg-surface-2 text-ink-2 px-2 py-1 rounded border border-line">
								J{data.matchday.number}
							</span>
						)
					)}
					<span className="bg-surface-2 text-ink-2 px-2 py-1 rounded border border-line">
						{data.match.matchDate}
					</span>
					{data.match.cedula && (
						<span className="bg-blue/10 text-blue px-2 py-1 rounded font-mono font-semibold border border-blue/20">
							{data.match.cedula}
						</span>
					)}
					{canPrintCedula && (
						<a
							href={`/cedula/partido/${data.match.id}`}
							target="_blank"
							rel="noopener noreferrer"
							title="Imprimir cédula de este partido"
							className="flex items-center gap-1 bg-surface-2 text-ink-2 hover:text-brand-ink hover:border-brand/40 px-2 py-1 rounded border border-line transition-colors"
						>
							<Printer size={12} strokeWidth={2} />
							Imprimir
						</a>
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

				{/* Status + Guardar + Progreso */}
				<div className="flex flex-col items-end gap-1 ml-auto">
					<div className="flex items-center gap-2">
						<StatusDropdown value={state.status} onChange={onStatusChange} />
						<button
							onClick={onSaveNext}
							disabled={hasGoalMismatch}
							title={
								hasGoalMismatch ? "Los goles capturados no coinciden con el marcador" : undefined
							}
							className="flex items-center gap-1.5 bg-brand hover:bg-brand-dim text-pitch text-sm font-bold px-3 py-1.5 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-brand"
						>
							<Save size={14} />
							Guardar y siguiente
						</button>
					</div>

					{hasGoalMismatch && (
						<div className="flex items-center gap-1.5 text-xs font-semibold text-rose">
							<AlertTriangle size={13} />
							Los goles no coinciden con el marcador — corrígelos para poder guardar
						</div>
					)}

					{/* Barra de progreso de jornada */}
					{totalMatches > 0 && (
						<div className="flex items-center gap-2 w-full">
							<div className="flex-1 bg-surface-2 rounded-full h-1.5 border border-line">
								<div
									className={`h-1.5 rounded-full transition-all ${capturedCount === totalMatches ? "bg-green-500" : "bg-brand"}`}
									style={{ width: `${Math.round((capturedCount / totalMatches) * 100)}%` }}
								/>
							</div>
							<span
								className={`text-xs font-semibold shrink-0 tabular-nums ${capturedCount === totalMatches ? "text-green-600" : "text-ink-2"}`}
							>
								{capturedCount}/{totalMatches}
							</span>
						</div>
					)}

					{/* Autosave */}
					<div className="text-xs text-ink-3 h-3.5 self-end">
						{saveStatus === "saving" && "Guardando…"}
						{saveStatus === "saved" && lastSavedAt && `Guardado ${formatTime(lastSavedAt)}`}
						{saveStatus === "error" && <span className="text-rose">Error al guardar</span>}
					</div>
				</div>
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
