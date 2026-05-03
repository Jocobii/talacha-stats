"use client";

import type {
	GlobalCandidate,
	ParsedRow,
	ImportDecision,
} from "../../types";
import { CandidateButton } from "./CandidateButton";

type Props = {
	row: ParsedRow;
	candidates: GlobalCandidate[];
	decision: ImportDecision | undefined;
	onDecide: (rowId: string, decision: ImportDecision) => void;
};

export function SuggestionCard({ row, candidates, decision, onDecide }: Props) {
	const rowId = row.fingerprint;

	const activePlayerId =
		decision?.kind === "propose_claim" ? decision.playerId : null;
	const isCreateNew = !decision || decision.kind === "create_new";

	return (
		<div className="rounded-2xl border-2 border-blue-200 overflow-hidden">
			{/* Header */}
			<div className="px-4 py-3 bg-blue-50 border-b border-blue-100 flex items-center gap-3">
				<div className="w-9 h-9 rounded-full bg-blue-100 shrink-0 flex items-center justify-center text-base">
					🌐
				</div>
				<div className="flex-1 min-w-0">
					<p className="font-extrabold text-ink text-base leading-tight">
						{row.rawFullName}
					</p>
					<p className="text-xs text-ink-2 mt-0.5">
						{row.team}
						{row.jerseyNumber != null ? ` · #${row.jerseyNumber}` : ""}
					</p>
				</div>
			</div>

			{/* Body */}
			<div className="p-3 flex flex-col gap-2">
				{/* Explainer — safety-first copy */}
				<div className="rounded-xl bg-blue-50 border border-blue-100 px-3 py-2 text-xs text-blue-800 leading-relaxed">
					<span className="font-semibold">¿Este jugador ya está en otra liga de la plataforma?</span>{" "}
					Si es la misma persona real, puedes proponer vincularlo. La propuesta
					queda pendiente hasta que la otra organización también confirme, o el
					jugador reclame su perfil.
				</div>

				<p className="text-xs font-semibold text-ink-3 uppercase tracking-wide px-1 mb-1">
					Posibles coincidencias globales
				</p>

				{candidates.map((c) => (
					<CandidateButton
						key={c.playerId}
						selected={activePlayerId === c.playerId}
						variant="secondary"
						aria-label={`Proponer vinculación de "${row.rawFullName}" con ${c.canonicalName}`}
						onClick={() =>
							onDecide(rowId, {
								kind: "propose_claim",
								rowId,
								playerId: c.playerId,
							})
						}
					>
						<span className="flex flex-col gap-0.5">
							<span className="font-bold text-ink">{c.canonicalName}</span>
							<span className="text-xs text-ink-3">
								Registrado en {c.appearancesCount}{" "}
								{c.appearancesCount === 1 ? "liga" : "ligas"} de la plataforma
							</span>
						</span>
					</CandidateButton>
				))}

				{/* Create new (default) */}
				<CandidateButton
					selected={isCreateNew}
					aria-label={`Crear perfil nuevo para "${row.rawFullName}" sin vincular a jugador global`}
					onClick={() =>
						onDecide(rowId, {
							kind: "create_new",
							rowId,
							fullName: row.rawFullName,
						})
					}
				>
					<span className="flex flex-col">
						<span className="font-bold">No, crear perfil nuevo</span>
						<span className="text-[12px] font-normal text-ink-3">
							Se crea un perfil independiente en tu organización
						</span>
					</span>
				</CandidateButton>
			</div>
		</div>
	);
}
