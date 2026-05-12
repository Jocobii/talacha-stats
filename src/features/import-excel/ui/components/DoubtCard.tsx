"use client";

import type { ProfileCandidate, ParsedRow, ImportDecision } from "../../types";
import { CandidateButton } from "./CandidateButton";

type Props = {
	row: ParsedRow;
	candidates: ProfileCandidate[];
	decision: ImportDecision | undefined;
	onDecide: (rowId: string, decision: ImportDecision) => void;
};

function scoreLabel(score: number): string {
	if (score >= 80) return "Match alto";
	if (score >= 50) return "Match medio";
	return "Match bajo";
}

function scoreColor(score: number): string {
	if (score >= 80) return "text-green-700 bg-green-100";
	if (score >= 50) return "text-orange-700 bg-orange-100";
	return "text-gray-600 bg-gray-100";
}

export function DoubtCard({ row, candidates, decision, onDecide }: Props) {
	const rowId = row.fingerprint;
	const isResolved = !!decision;

	const activeProfileId = decision?.kind === "link_profile" ? decision.profileId : null;
	const isCreateNew = decision?.kind === "create_new";
	const isIgnore = decision?.kind === "ignore";

	return (
		<div
			className={[
				"rounded-2xl border-2 overflow-hidden transition-all duration-200",
				isResolved ? "border-brand/30" : "border-orange-300",
			].join(" ")}
		>
			{/* Header */}
			<div
				className={[
					"px-4 py-3 flex items-center gap-3 border-b",
					isResolved ? "bg-brand/5 border-brand/10" : "bg-orange-50 border-orange-100",
				].join(" ")}
			>
				<div
					className={[
						"w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-base",
						isResolved ? "bg-brand/15" : "bg-orange-100",
					].join(" ")}
				>
					{isResolved ? "✓" : "?"}
				</div>
				<div className="flex-1 min-w-0">
					<p className="font-extrabold text-ink text-base leading-tight">{row.rawFullName}</p>
					<p className="text-xs text-ink-2 mt-0.5">
						{row.team}
						{row.jerseyNumber != null ? ` · #${row.jerseyNumber}` : ""}
						{row.goals > 0 ? ` · ${row.goals} goles` : ""}
					</p>
				</div>
				{isResolved && (
					<span className="text-xs font-semibold text-brand bg-brand/10 border border-brand/20 rounded-lg px-2 py-0.5 shrink-0">
						Decidido
					</span>
				)}
			</div>

			{/* Candidates */}
			<div className="p-3 flex flex-col gap-2">
				<p className="text-xs font-semibold text-ink-3 uppercase tracking-wide px-1 mb-1">
					¿Es alguno de estos jugadores?
				</p>

				{candidates.map((c) => (
					<CandidateButton
						key={c.profileId}
						selected={activeProfileId === c.profileId}
						aria-label={`Vincular "${row.rawFullName}" con ${c.fullName} de ${c.leagueName}`}
						onClick={() =>
							onDecide(rowId, {
								kind: "link_profile",
								rowId,
								profileId: c.profileId,
							})
						}
					>
						<span className="flex flex-col gap-0.5">
							<span className="flex items-center gap-2 flex-wrap">
								<span className="font-bold text-ink">{c.fullName}</span>
								{c.alias && <span className="text-ink-2 font-normal">&quot;{c.alias}&quot;</span>}
								<span
									className={[
										"text-[11px] font-semibold px-1.5 py-0.5 rounded-full",
										scoreColor(c.score),
									].join(" ")}
								>
									{scoreLabel(c.score)}
								</span>
							</span>
							<span className="text-xs text-ink-3">{c.leagueName}</span>
							{c.reason && <span className="text-[11px] text-ink-3 italic">{c.reason}</span>}
						</span>
					</CandidateButton>
				))}

				{/* Create new */}
				<CandidateButton
					selected={isCreateNew ?? false}
					variant="secondary"
					aria-label={`Crear nuevo perfil para "${row.rawFullName}"`}
					onClick={() =>
						onDecide(rowId, {
							kind: "create_new",
							rowId,
							fullName: row.rawFullName,
						})
					}
				>
					<span className="flex flex-col">
						<span className="font-bold">Es un jugador nuevo</span>
						<span className="text-[12px] font-normal text-ink-3">
							Se creará un perfil nuevo en tu organización
						</span>
					</span>
				</CandidateButton>

				{/* Ignore */}
				<CandidateButton
					selected={isIgnore ?? false}
					variant="danger"
					aria-label={`Ignorar la fila de "${row.rawFullName}"`}
					onClick={() => onDecide(rowId, { kind: "ignore", rowId })}
				>
					<span className="flex flex-col">
						<span className="font-bold">Ignorar esta fila</span>
						<span className="text-[12px] font-normal text-ink-3">
							No se importarán las estadísticas de esta fila
						</span>
					</span>
				</CandidateButton>
			</div>
		</div>
	);
}
