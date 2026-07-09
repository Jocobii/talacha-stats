"use client";
/**
 * CloseMatchdayButton — botón de cierre de jornada.
 * Solo visible cuando todos los partidos están capturados.
 * Llama a POST /api/matchdays/[matchdayId]/close y redirige al calendario.
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { apiFetch } from "@/shared/api/client";

type Props = {
	matchdayId: string;
	leagueId: string;
	matchdayNumber: number;
};

export function CloseMatchdayButton({ matchdayId, leagueId, matchdayNumber }: Props) {
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleClose = async () => {
		const confirmed = confirm(
			`¿Cerrar Jornada ${matchdayNumber}?\n\nUna vez cerrada no podrás editar los resultados. La tabla de posiciones se actualizará con los datos capturados.`,
		);
		if (!confirmed) return;

		setLoading(true);
		setError(null);
		try {
			const result = await apiFetch(`/api/matchdays/${matchdayId}/close`, { method: "POST" });
			if (!result.ok) {
				setError(result.error ?? "Error al cerrar la jornada");
				return;
			}
			router.push(`/admin/leagues/${leagueId}/calendario`);
			router.refresh();
		} catch (networkError) {
			console.error("[CloseMatchdayButton] close", networkError);
			setError("Error de red. Intenta de nuevo.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="flex flex-col items-end gap-1">
			<button
				onClick={handleClose}
				disabled={loading}
				className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold px-5 py-2 rounded transition-colors"
			>
				<Lock size={14} strokeWidth={2.5} />
				{loading ? "Cerrando…" : `Cerrar Jornada ${matchdayNumber}`}
			</button>
			{error && <p className="text-xs text-rose-400">{error}</p>}
		</div>
	);
}
