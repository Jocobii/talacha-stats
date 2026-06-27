"use client";
/**
 * features/match-resolution/ui/AdHocPlayerModal.tsx
 * Modal para agregar un jugador ad-hoc al partido. Componente de presentación:
 * React Hook Form + zodResolver y la mutación useAddAdHocPlayer (TanStack Query).
 * No hace fetch ni arma el draft a mano: delega el POST al hook y la construcción
 * del PlayerStatDraft al mapper.
 */
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { TeamSide, PlayerStatDraft } from "../types";
import { AdHocPlayerFormSchema, type AdHocPlayerFormInput } from "../model/ad-hoc-form-schema";
import { useAddAdHocPlayer } from "../model/useAddAdHocPlayer";
import { mapAdHocResultToDraft } from "../lib/map-ad-hoc-draft";

type Props = {
	matchId: string;
	side: TeamSide;
	existingPlayers: PlayerStatDraft[];
	onAdded: (player: PlayerStatDraft) => void;
	onClose: () => void;
};

function nextFreeNumber(players: PlayerStatDraft[]): number {
	const used = new Set(players.map((p) => p.jerseyNumber).filter(Boolean));
	for (let n = 1; n <= 99; n++) {
		if (!used.has(n)) return n;
	}
	return 1;
}

export function AdHocPlayerModal({ matchId, side, existingPlayers, onAdded, onClose }: Props) {
	const addPlayer = useAddAdHocPlayer(matchId);
	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<AdHocPlayerFormInput>({
		resolver: zodResolver(AdHocPlayerFormSchema),
		defaultValues: { fullName: "", shirtNumber: nextFreeNumber(existingPlayers) },
	});

	function onValid(values: AdHocPlayerFormInput) {
		addPlayer.mutate(
			{ teamSide: side, ...values },
			{
				onSuccess: (result) => {
					onAdded(mapAdHocResultToDraft(result, values));
					onClose();
				},
			},
		);
	}

	const sideLabel = side === "home" ? "Local" : "Visitante";
	const errorMessage = errors.fullName?.message ?? addPlayer.error?.message ?? null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
			<div className="bg-surface border border-line rounded-lg p-6 max-w-sm w-full shadow-2xl mx-4">
				<h2 className="text-base font-semibold text-ink mb-4">Añadir jugador — {sideLabel}</h2>
				<form onSubmit={handleSubmit(onValid)} className="flex flex-col gap-3">
					<div>
						<label className="text-xs text-ink-2 mb-1 block">Nombre completo</label>
						<input
							autoFocus
							{...register("fullName")}
							placeholder="Ej: Juan García López"
							className="w-full bg-surface-2 border border-line text-ink placeholder:text-ink-3 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
						/>
					</div>
					<div>
						<label className="text-xs text-ink-2 mb-1 block">Número de playera</label>
						<input
							type="number"
							min={1}
							max={99}
							inputMode="numeric"
							{...register("shirtNumber", { valueAsNumber: true })}
							className="w-24 bg-surface-2 border border-line text-ink rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
						/>
					</div>

					{errorMessage && <p className="text-xs text-rose">{errorMessage}</p>}

					<div className="flex gap-2 justify-end pt-1">
						<button
							type="button"
							onClick={onClose}
							className="px-3 py-1.5 text-sm text-ink-2 border border-line rounded hover:bg-surface-2 transition-colors"
						>
							Cancelar
						</button>
						<button
							type="submit"
							disabled={addPlayer.isPending}
							className="px-3 py-1.5 text-sm bg-brand hover:bg-brand-dim text-pitch font-semibold rounded disabled:opacity-50 transition-colors"
						>
							{addPlayer.isPending ? "Guardando…" : "Añadir y capturar"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
