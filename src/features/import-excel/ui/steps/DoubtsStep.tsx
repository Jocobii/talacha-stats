"use client";

import type {
	MatchOutcome,
	ImportDecision,
} from "../../types";
import { DoubtCard } from "../components/DoubtCard";

type DoubtOutcome = Extract<MatchOutcome, { kind: "intra_org_doubt" }>;

type Props = {
	doubts: DoubtOutcome[];
	decisions: Record<string, ImportDecision>;
	onDecide: (rowId: string, decision: ImportDecision) => void;
	allDone: boolean;
	onContinue: () => void;
	onBack: () => void;
};

export function DoubtsStep({
	doubts,
	decisions,
	onDecide,
	allDone,
	onContinue,
	onBack,
}: Props) {
	const resolvedCount = doubts.filter(
		(d) => !!decisions[d.row.fingerprint],
	).length;

	return (
		<div className="flex flex-col gap-4">
			{/* Header */}
			<div className="bg-orange-50 border border-orange-200 rounded-2xl px-4 py-3 flex items-center gap-3">
				<span className="text-2xl shrink-0">⚠️</span>
				<div className="flex-1">
					<p className="font-bold text-orange-800 text-sm">
						{doubts.length} jugador{doubts.length > 1 ? "es requieren" : " requiere"} revisión
					</p>
					<p className="text-xs text-orange-700 mt-0.5">
						Encontramos nombres similares en tu organización. Elige si es el
						mismo jugador o uno nuevo.
					</p>
				</div>
				<span className="shrink-0 text-sm font-bold text-orange-700">
					{resolvedCount}/{doubts.length}
				</span>
			</div>

			{/* Progress bar */}
			<div className="h-1.5 rounded-full bg-orange-100 overflow-hidden">
				<div
					className="h-full bg-brand rounded-full transition-all duration-300"
					style={{ width: `${(resolvedCount / doubts.length) * 100}%` }}
				/>
			</div>

			{/* Cards */}
			<div className="flex flex-col gap-3">
				{doubts.map((d) => (
					<DoubtCard
						key={d.row.fingerprint}
						row={d.row}
						candidates={d.candidates}
						decision={decisions[d.row.fingerprint]}
						onDecide={onDecide}
					/>
				))}
			</div>

			{/* Actions */}
			<div className="flex gap-3 pt-1">
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
					disabled={!allDone}
					className={[
						"flex-1 py-3 rounded-xl font-bold text-sm transition",
						allDone
							? "bg-brand text-white hover:bg-brand-dim shadow-[0_2px_8px_rgba(22,163,74,0.3)]"
							: "bg-line text-ink-3 cursor-not-allowed",
					].join(" ")}
				>
					{allDone
						? "Continuar →"
						: `Faltan ${doubts.length - resolvedCount} por decidir`}
				</button>
			</div>
		</div>
	);
}
