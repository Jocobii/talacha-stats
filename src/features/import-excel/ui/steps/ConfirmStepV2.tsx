"use client";

import type { ImportDecision, ImportPreviewResult } from "../../types";

type Props = {
	preview: ImportPreviewResult;
	decisions: Record<string, ImportDecision>;
	loading: boolean;
	error: string;
	onConfirm: () => void;
	onBack: () => void;
};

export function ConfirmStepV2({ preview, decisions, loading, error, onConfirm, onBack }: Props) {
	const decisionsArr = Object.values(decisions);
	const linkedCount = decisionsArr.filter((d) => d.kind === "link_profile").length;
	const createdCount = decisionsArr.filter((d) => d.kind === "create_new").length;
	const claimedCount = decisionsArr.filter((d) => d.kind === "propose_claim").length;
	const ignoredCount = decisionsArr.filter((d) => d.kind === "ignore").length;

	const rows: { label: string; value: number; icon: string; show: boolean }[] = [
		{ label: "Auto-vinculados (mismo perfil)", value: linkedCount, icon: "⚡", show: true },
		{ label: "Perfiles nuevos a crear", value: createdCount, icon: "🆕", show: createdCount > 0 },
		{
			label: "Propuestas de vinculación cross-liga",
			value: claimedCount,
			icon: "🌐",
			show: claimedCount > 0,
		},
		{ label: "Filas ignoradas", value: ignoredCount, icon: "—", show: ignoredCount > 0 },
	].filter((r) => r.show);

	return (
		<div className="flex flex-col gap-5">
			<div className="bg-surface rounded-2xl border border-line shadow-sm p-5">
				<h2 className="text-lg font-bold text-ink mb-4">Resumen de la importación</h2>

				<div className="flex flex-col divide-y divide-line">
					{rows.map((r) => (
						<div key={r.label} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
							<span className="text-xl shrink-0 w-7 text-center">{r.icon}</span>
							<span className="flex-1 text-sm text-ink">{r.label}</span>
							<span className="font-black text-ink text-lg">{r.value}</span>
						</div>
					))}
				</div>

				{preview.jornada != null && (
					<p className="mt-4 text-xs text-ink-3 border-t border-line pt-3">
						Jornada {preview.jornada} · {preview.outcomes.length} filas en total
					</p>
				)}
			</div>

			{error && (
				<p className="text-red-600 text-sm bg-red-50 border border-red-200 px-4 py-3 rounded-xl">
					{error}
				</p>
			)}

			<div className="flex gap-3">
				<button
					type="button"
					onClick={onBack}
					disabled={loading}
					className="px-5 py-3 rounded-xl border border-line text-sm font-semibold text-ink-2 hover:border-ink-3 transition disabled:opacity-40"
				>
					← Atrás
				</button>
				<button
					type="button"
					onClick={onConfirm}
					disabled={loading}
					className={[
						"flex-1 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition",
						!loading
							? "bg-brand text-white hover:bg-brand-dim shadow-[0_4px_12px_rgba(22,163,74,0.35)]"
							: "bg-line text-ink-3 cursor-not-allowed",
					].join(" ")}
				>
					{loading ? (
						<>
							<span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
							Guardando...
						</>
					) : (
						"Confirmar importación ✓"
					)}
				</button>
			</div>
		</div>
	);
}
