"use client";

import { GoleadoresPreview } from "./GoleadoresPreview";
import { StandingsPreview } from "./StandingsPreview";
import type { BulkPreviewResult } from "../model";
import type { PlayerResolution } from "../resolver";

type Props = {
	preview: BulkPreviewResult;
	resolutions: Record<string, string>;
	onResolve: (rawName: string, playerId: string) => void;
	excludedRows: Set<string>;
	onToggleExclude: (key: string) => void;
	onClearExcluded: () => void;
	// Derived
	ambiguous: PlayerResolution[];
	confirmed: PlayerResolution[];
	newPlayers: PlayerResolution[];
	pendingCount: number;
	allResolved: boolean;
	// Navigation
	onBack: () => void;
	onConfirm: () => void;
	loading: boolean;
	error: string;
};

export function PreviewStep({
	preview,
	resolutions,
	onResolve,
	excludedRows,
	onToggleExclude,
	onClearExcluded,
	ambiguous,
	confirmed,
	newPlayers,
	pendingCount,
	allResolved,
	onBack,
	onConfirm,
	loading,
	error,
}: Props) {
	const canConfirm = pendingCount === 0;

	return (
		<div className="flex flex-col gap-5">
			{/* Step-specific content */}
			{preview.type === "goleadores" ? (
				<GoleadoresPreview
					preview={preview as BulkPreviewResult & { type: "goleadores" }}
					resolutions={resolutions}
					onResolve={onResolve}
					ambiguous={ambiguous}
					confirmed={confirmed}
					newPlayers={newPlayers}
					pendingCount={pendingCount}
					allResolved={allResolved}
				/>
			) : (
				<StandingsPreview
					preview={preview as BulkPreviewResult & { type: "standings" }}
					excludedRows={excludedRows}
					onToggleExclude={onToggleExclude}
					onClearExcluded={onClearExcluded}
				/>
			)}

			{error && (
				<p className="text-red-600 text-sm bg-red-950/40 border border-red-800/50 px-4 py-2.5 rounded-xl">
					{error}
				</p>
			)}

			{/* Navigation */}
			<div className="flex flex-col gap-3">
				{pendingCount > 0 && (
					<p className="text-orange-700 text-sm bg-orange-50 border border-orange-200 px-4 py-2.5 rounded-xl">
						⚠️ Faltan {pendingCount} jugador{pendingCount !== 1 ? "es" : ""} por seleccionar arriba.
					</p>
				)}
				<div className="flex gap-3">
					<button
						type="button"
						onClick={onBack}
						className="bg-surface border border-line text-ink px-5 py-3.5 rounded-2xl text-[15px] font-semibold hover:bg-surface-2 transition"
					>
						← Atrás
					</button>
					<button
						type="button"
						onClick={onConfirm}
						disabled={loading || !canConfirm}
						className={[
							"flex-1 py-3.5 rounded-2xl text-[15px] font-bold text-white flex items-center justify-center gap-2 transition-all duration-300",
							canConfirm && !loading
								? "bg-brand hover:bg-brand-dim shadow-[0_4px_12px_rgba(22,163,74,0.35)]"
								: "bg-line cursor-not-allowed",
						].join(" ")}
					>
						{loading ? (
							<>
								<span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
								Importando...
							</>
						) : preview.type === "goleadores" ? (
							canConfirm ? (
								`Confirmar e importar ${preview.summary.players ?? 0} jugadores ✓`
							) : (
								`Identifica ${pendingCount} jugador${pendingCount !== 1 ? "es" : ""} primero`
							)
						) : (
							"Confirmar e importar ✓"
						)}
					</button>
				</div>
			</div>
		</div>
	);
}
