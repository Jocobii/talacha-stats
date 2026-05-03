"use client";

import type { MatchOutcome, ImportDecision } from "../../types";
import { SuggestionCard } from "../components/SuggestionCard";

type SuggestionOutcome = Extract<MatchOutcome, { kind: "cross_org_suggestion" }>;

type Props = {
	suggestions: SuggestionOutcome[];
	decisions: Record<string, ImportDecision>;
	onDecide: (rowId: string, decision: ImportDecision) => void;
	onContinue: () => void;
	onBack: () => void;
};

export function SuggestionsStep({ suggestions, decisions, onDecide, onContinue, onBack }: Props) {
	const claimCount = suggestions.filter(
		(s) => decisions[s.row.fingerprint]?.kind === "propose_claim",
	).length;

	return (
		<div className="flex flex-col gap-4">
			{/* Header */}
			<div className="bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3 flex items-start gap-3">
				<span className="text-2xl shrink-0 mt-0.5">🌐</span>
				<div className="flex-1">
					<p className="font-bold text-blue-800 text-sm">Posibles coincidencias en otras ligas</p>
					<p className="text-xs text-blue-700 mt-0.5 leading-relaxed">
						Estos jugadores tienen nombres muy parecidos a jugadores ya registrados en la
						plataforma. Puedes proponer vincularlos o ignorar la sugerencia — este paso es opcional.
					</p>
				</div>
			</div>

			{/* Cards */}
			<div className="flex flex-col gap-3">
				{suggestions.map((s) => (
					<SuggestionCard
						key={s.row.fingerprint}
						row={s.row}
						candidates={s.candidates}
						decision={decisions[s.row.fingerprint]}
						onDecide={onDecide}
					/>
				))}
			</div>

			{claimCount > 0 && (
				<div className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 text-xs text-blue-800 leading-relaxed">
					<span className="font-semibold">
						{claimCount} propuesta{claimCount > 1 ? "s" : ""} de vinculación.
					</span>{" "}
					Se activarán cuando la otra organización también confirme, o el jugador reclame su perfil
					desde la app.
				</div>
			)}

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
					className="flex-1 py-3 rounded-xl bg-brand text-white font-bold text-sm hover:bg-brand-dim transition shadow-[0_2px_8px_rgba(22,163,74,0.3)]"
				>
					Continuar →
				</button>
			</div>
		</div>
	);
}
