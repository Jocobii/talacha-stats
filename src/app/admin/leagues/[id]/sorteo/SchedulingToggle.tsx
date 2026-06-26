"use client";

/**
 * SchedulingToggle — Activa/desactiva el módulo de sorteo para una liga.
 * Solo renderizado para owners. Llama POST /api/leagues/[id]/scheduling-toggle.
 */

import { useState } from "react";
import { ToggleLeft, ToggleRight, Loader2 } from "lucide-react";
import { apiFetch } from "@/shared/api/client";

type Props = {
	leagueId: string;
	initialEnabled: boolean;
};

export function SchedulingToggle({ leagueId, initialEnabled }: Props) {
	const [enabled, setEnabled] = useState(initialEnabled);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function handleToggle() {
		setLoading(true);
		setError(null);
		try {
			const result = await apiFetch(`/api/leagues/${leagueId}/scheduling-toggle`, {
				method: "POST",
				body: { enabled: !enabled },
			});
			if (!result.ok) {
				setError(result.error ?? "Error al cambiar el estado");
				return;
			}
			setEnabled(!enabled);
			window.location.reload();
		} catch (networkError) {
			console.error("[SchedulingToggle] toggle", networkError);
			setError("Error inesperado");
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="flex flex-col items-end gap-1">
			<button
				onClick={handleToggle}
				disabled={loading}
				className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
					enabled
						? "bg-green-100 text-green-700 hover:bg-green-200"
						: "bg-surface-2 text-ink-2 hover:bg-surface-3"
				} disabled:opacity-50`}
			>
				{loading ? (
					<Loader2 size={16} className="animate-spin" />
				) : enabled ? (
					<ToggleRight size={16} />
				) : (
					<ToggleLeft size={16} />
				)}
				{enabled ? "Módulo activo" : "Módulo inactivo"}
			</button>
			{error && <p className="text-xs text-red-500">{error}</p>}
		</div>
	);
}
