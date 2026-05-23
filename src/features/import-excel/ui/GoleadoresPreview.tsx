"use client";

import { PlayerResolutionCard } from "./PlayerResolutionCard";
import { AnomalyPanel } from "./AnomalyPanel";
import type { BulkPreviewResult } from "../model";
import type { PlayerResolution } from "../resolver";

type Props = {
	preview: BulkPreviewResult & { type: "goleadores" };
	resolutions: Record<string, string>;
	onResolve: (rawName: string, playerId: string) => void;
	// Derived — passed down to avoid recomputing
	ambiguous: PlayerResolution[];
	confirmed: PlayerResolution[];
	newPlayers: PlayerResolution[];
	pendingCount: number;
	allResolved: boolean;
};

export function GoleadoresPreview({
	preview,
	resolutions,
	onResolve,
	ambiguous,
	confirmed,
	newPlayers,
	pendingCount,
	allResolved,
}: Props) {
	return (
		<>
			{/* Dynamic summary banner */}
			<div
				className={[
					"rounded-2xl border p-4 flex items-center gap-4 flex-wrap transition-all duration-300",
					allResolved ? "bg-brand/10 border-brand/20" : "bg-orange-50 border-orange-200",
				].join(" ")}
			>
				<span className="text-3xl shrink-0">{allResolved ? "✅" : "⚠️"}</span>
				<div className="flex-1">
					<p
						className={`text-base font-bold ${allResolved ? "text-brand-ink" : "text-orange-800"}`}
					>
						{allResolved
							? `¡Todo listo! ${preview.summary.players ?? 0} jugadores · ${preview.summary.totalGoals ?? 0} goles — Jornada ${preview.jornada}`
							: `Identifica ${pendingCount} jugador${pendingCount !== 1 ? "es" : ""} antes de importar`}
					</p>
					<p className={`text-xs mt-0.5 ${allResolved ? "text-brand-ink" : "text-orange-700"}`}>
						{allResolved
							? "Todo el mapeo está completo y listo para guardar."
							: `${ambiguous.length - pendingCount} de ${ambiguous.length} jugadores ambiguos identificados`}
					</p>
				</div>
				<div className="flex gap-4 shrink-0 w-full sm:w-auto justify-around sm:justify-start">
					{[
						{ label: "Jugadores", value: preview.summary.players ?? 0, color: "text-brand-ink" },
						{ label: "Goles", value: preview.summary.totalGoals ?? 0, color: "text-brand-ink" },
						{
							label: "Pendientes",
							value: pendingCount,
							color: pendingCount > 0 ? "text-orange-700" : "text-ink-3",
						},
					].map((s) => (
						<div key={s.label} className="text-center">
							<div
								className={`text-[22px] font-black leading-tight ${s.color}`}
								style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
							>
								{s.value}
							</div>
							<div className="text-[10px] text-ink-3 uppercase tracking-wider">{s.label}</div>
						</div>
					))}
				</div>
			</div>

			{/* Anomaly reports */}
			{preview.anomalyReports && preview.anomalyReports.length > 0 && (
				<AnomalyPanel anomalyReports={preview.anomalyReports} />
			)}

			{/* Ambiguous players requiring manual resolution */}
			{ambiguous.length > 0 && (
				<div className="flex flex-col gap-3">
					<div className="flex items-center gap-3">
						<div className="flex-1 h-px bg-surface-2" />
						<span className="text-xs font-bold text-ink-2 uppercase tracking-wider whitespace-nowrap px-2">
							{ambiguous.filter((p) => !!resolutions[p.rawName]).length}/{ambiguous.length}{" "}
							identificados
						</span>
						<div className="flex-1 h-px bg-surface-2" />
					</div>
					{ambiguous.map((pm) => (
						<PlayerResolutionCard
							key={pm.rawName}
							pm={pm}
							resolution={resolutions[pm.rawName] ?? ""}
							onResolve={onResolve}
						/>
					))}
				</div>
			)}

			{/* New players (auto-created) */}
			{newPlayers.length > 0 && (
				<div className="bg-blue-950/40 border border-blue-800/50 rounded-2xl p-4">
					<div className="flex items-center gap-2 mb-3">
						<span className="text-base">🆕</span>
						<p className="text-sm font-bold text-blue-300">
							{newPlayers.length === 1
								? "1 jugador nuevo"
								: `${newPlayers.length} jugadores nuevos`}{" "}
							— se crearán automáticamente
						</p>
					</div>
					<div className="flex flex-col gap-1.5">
						{newPlayers.map((pm) => (
							<div
								key={pm.rawName}
								className="flex items-center gap-2 bg-surface rounded-xl px-3 py-2"
							>
								<span className="text-blue-500 text-sm">•</span>
								<span className="text-sm font-semibold text-ink flex-1">{pm.rawName}</span>
								{pm.teamName && <span className="text-xs text-ink-2">{pm.teamName}</span>}
							</div>
						))}
					</div>
				</div>
			)}

			{/* Confirmed players (collapsible) */}
			{confirmed.length > 0 && (
				<details className="bg-surface border border-line rounded-2xl overflow-hidden group">
					<summary className="px-4 py-3 cursor-pointer text-sm font-semibold text-ink-2 select-none list-none flex items-center gap-2">
						<span className="text-brand-ink">✅</span>
						{confirmed.length === 1 ? "1 jugador" : `${confirmed.length} jugadores`} reconocidos
						automáticamente
						<span className="ml-auto text-xs text-ink-3 group-open:hidden">Ver lista ▾</span>
						<span className="ml-auto text-xs text-ink-3 hidden group-open:inline">Ocultar ▴</span>
					</summary>
					<div className="border-t border-line">
						{confirmed.map((pm) => (
							<div
								key={pm.rawName}
								className="flex items-center gap-2 px-4 py-2.5 border-b border-line last:border-0"
							>
								<span className="text-brand-ink text-sm shrink-0">✓</span>
								<span className="text-sm font-semibold text-ink">{pm.rawName}</span>
								{pm.playerId && <span className="text-xs text-ink-3 ml-1">identificado</span>}
							</div>
						))}
					</div>
				</details>
			)}

			{/* Blocking message when pending resolutions exist */}
			{pendingCount > 0 && (
				<div className="bg-red-950/40 border border-red-800/50 rounded-xl px-4 py-3 flex gap-2 items-center">
					<span className="text-lg shrink-0">🚫</span>
					<p className="text-sm text-red-400 font-medium">
						Identifica los {pendingCount} jugador{pendingCount !== 1 ? "es" : ""} marcados con ⚠️
						arriba para poder importar.
					</p>
				</div>
			)}
		</>
	);
}
