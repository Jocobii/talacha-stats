"use client";

import type { ImportPreviewResult } from "../../types";

type Props = {
	preview: ImportPreviewResult;
	warnings: string[];
	onContinue: () => void;
	onBack: () => void;
};

type StatBlock = {
	label: string;
	value: number;
	icon: string;
	color: string;
};

export function PreviewStepV2({ preview, warnings, onContinue, onBack }: Props) {
	const { summary } = preview;
	const total = summary.auto + summary.doubts + summary.suggestions + summary.createNew;

	const stats: StatBlock[] = [
		{
			label: "Auto-resueltos",
			value: summary.auto,
			icon: "⚡",
			color: "bg-brand/10 text-brand border-brand/20",
		},
		{
			label: "Requieren revisión",
			value: summary.doubts,
			icon: "⚠️",
			color:
				summary.doubts > 0
					? "bg-orange-50 text-orange-700 border-orange-200"
					: "bg-surface-2 text-ink-3 border-line",
		},
		{
			label: "Sugerencias externas",
			value: summary.suggestions,
			icon: "🌐",
			color:
				summary.suggestions > 0
					? "bg-blue-50 text-blue-700 border-blue-200"
					: "bg-surface-2 text-ink-3 border-line",
		},
		{
			label: "Jugadores nuevos",
			value: summary.createNew,
			icon: "🆕",
			color: "bg-surface-2 text-ink border-line",
		},
	];

	return (
		<div className="flex flex-col gap-5">
			<div className="bg-surface rounded-2xl border border-line shadow-sm p-5">
				<h2 className="text-lg font-bold text-ink mb-1">
					Vista previa del Excel
				</h2>
				<p className="text-sm text-ink-2 mb-5">
					{total} jugadores procesados
					{preview.jornada != null ? ` · Jornada ${preview.jornada}` : ""}
				</p>

				<div className="grid grid-cols-2 gap-3">
					{stats.map((s) => (
						<div
							key={s.label}
							className={[
								"rounded-xl border p-3 flex items-center gap-3",
								s.color,
							].join(" ")}
						>
							<span className="text-2xl shrink-0">{s.icon}</span>
							<div>
								<p className="text-2xl font-black leading-none">{s.value}</p>
								<p className="text-[12px] font-medium leading-snug mt-0.5">
									{s.label}
								</p>
							</div>
						</div>
					))}
				</div>
			</div>

			{/* Warnings */}
			{warnings.length > 0 && (
				<div className="rounded-xl border border-orange-200 bg-orange-50 p-4 flex flex-col gap-1.5">
					<p className="text-xs font-semibold text-orange-700 uppercase tracking-wide">
						Avisos
					</p>
					{warnings.map((w, i) => (
						<p key={i} className="text-sm text-orange-800 leading-snug">
							• {w}
						</p>
					))}
				</div>
			)}

			{/* What happens next */}
			{summary.doubts === 0 && summary.suggestions === 0 && (
				<div className="rounded-xl bg-brand/5 border border-brand/15 px-4 py-3 text-sm text-brand">
					✓ Todo auto-resuelto — puedes confirmar directamente.
				</div>
			)}

			<div className="flex gap-3">
				<button
					type="button"
					onClick={onBack}
					className="px-5 py-3 rounded-xl border border-line text-sm font-semibold text-ink-2 hover:border-ink-3 transition"
				>
					← Atrás
				</button>
				<button
					type="button"
					onClick={onContinue}
					className="flex-1 py-3 rounded-xl bg-brand text-white font-bold text-sm hover:bg-brand-dim transition shadow-[0_2px_8px_rgba(22,163,74,0.3)]"
				>
					{summary.doubts > 0
						? `Resolver ${summary.doubts} duda${summary.doubts > 1 ? "s" : ""} →`
						: "Confirmar importación →"}
				</button>
			</div>
		</div>
	);
}
