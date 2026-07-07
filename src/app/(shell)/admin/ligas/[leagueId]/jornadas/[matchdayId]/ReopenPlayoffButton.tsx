"use client";
/**
 * ReopenPlayoffButton — reabre una jornada de fase final que quedó
 * accidentalmente en estado "completed".
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Unlock } from "lucide-react";
import { apiFetch } from "@/shared/api/client";

type Props = { matchdayId: string };

export function ReopenPlayoffButton({ matchdayId }: Props) {
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleReopen = async () => {
		if (!confirm("¿Reabrir la Fase Final para continuar capturando partidos?")) return;
		setLoading(true);
		setError(null);
		try {
			const result = await apiFetch(`/api/matchdays/${matchdayId}/reopen`, { method: "POST" });
			if (!result.ok) {
				setError(result.error ?? "Error al reabrir");
				return;
			}
			router.refresh();
		} catch (networkError) {
			console.error("[ReopenPlayoffButton] reopen", networkError);
			setError("Error de red. Intenta de nuevo.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="flex flex-col items-end gap-1">
			<button
				onClick={handleReopen}
				disabled={loading}
				className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold px-5 py-2 rounded transition-colors"
			>
				<Unlock size={14} strokeWidth={2.5} />
				{loading ? "Reabriendo…" : "Reabrir Fase Final"}
			</button>
			{error && <p className="text-xs text-rose-400">{error}</p>}
		</div>
	);
}
