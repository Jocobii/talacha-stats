"use client";
/**
 * features/match-resolution/ui/AdHocPlayerModal.tsx
 * Modal para agregar un jugador ad-hoc al partido.
 */
import { useState } from "react";
import type { TeamSide, PlayerStatDraft } from "../types";

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
	const [fullName, setFullName] = useState("");
	const [shirtNumber, setShirtNumber] = useState(nextFreeNumber(existingPlayers));
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (fullName.trim().length < 2) {
			setError("El nombre debe tener al menos 2 caracteres");
			return;
		}
		setLoading(true);
		setError(null);

		try {
			const res = await fetch(`/api/matches/${matchId}/players`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ teamSide: side, fullName: fullName.trim(), shirtNumber }),
			});
			const data = await res.json();

			if (!res.ok) {
				setError(data.error ?? "Error al agregar jugador");
				return;
			}

			onAdded({
				registrationId: data.data.registrationId,
				playerProfileId: data.data.playerProfileId,
				fullName: fullName.trim(),
				jerseyNumber: shirtNumber,
				isAdHoc: true,
				isPresent: true,
				shirtNumber,
				goals: 0,
				assists: 0,
				yellowCards: 0,
				blueCards: 0,
				redCards: 0,
				dirty: false,
			});
			onClose();
		} catch {
			setError("Error de conexión al agregar jugador");
		} finally {
			setLoading(false);
		}
	};

	const sideLabel = side === "home" ? "Local" : "Visitante";

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
			<div className="bg-surface border border-line rounded-lg p-6 max-w-sm w-full shadow-2xl mx-4">
				<h2 className="text-base font-semibold text-ink mb-4">Añadir jugador — {sideLabel}</h2>
				<form onSubmit={handleSubmit} className="flex flex-col gap-3">
					<div>
						<label className="text-xs text-ink-2 mb-1 block">Nombre completo</label>
						<input
							autoFocus
							value={fullName}
							onChange={(e) => setFullName(e.target.value)}
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
							value={shirtNumber}
							onChange={(e) => setShirtNumber(parseInt(e.target.value, 10) || 1)}
							inputMode="numeric"
							className="w-24 bg-surface-2 border border-line text-ink rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
						/>
					</div>

					{error && <p className="text-xs text-rose">{error}</p>}

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
							disabled={loading}
							className="px-3 py-1.5 text-sm bg-brand hover:bg-brand-dim text-pitch font-semibold rounded disabled:opacity-50 transition-colors"
						>
							{loading ? "Guardando…" : "Añadir y capturar"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
