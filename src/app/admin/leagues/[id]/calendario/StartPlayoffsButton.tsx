"use client";
/**
 * StartPlayoffsButton.tsx
 *
 * Botón "Iniciar Fase Final" — llama al endpoint POST /playoffs/start
 * y recarga la página al tener éxito.
 */

import { useState } from "react";
import { Trophy } from "lucide-react";
import { useRouter } from "next/navigation";

type Props = { leagueId: string };

export function StartPlayoffsButton({ leagueId }: Props) {
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleStart = async () => {
		if (!confirm("¿Iniciar la fase final ahora? Se generarán los brackets para todas las zonas.")) {
			return;
		}
		setError(null);
		setLoading(true);

		const res = await fetch(`/api/leagues/${leagueId}/playoffs/start`, {
			method: "POST",
		});
		const json = await res.json();
		setLoading(false);

		if (!res.ok) {
			setError(json.error ?? "Error al iniciar la fase final.");
			return;
		}

		router.refresh();
	};

	return (
		<div className="bg-surface rounded-lg shadow p-5 text-center space-y-3">
			<Trophy className="mx-auto text-brand-ink" size={32} />
			<p className="text-sm font-semibold text-ink">Fase Final</p>
			<p className="text-xs text-ink-2 max-w-xs mx-auto">
				Genera los brackets de eliminación directa para todas las zonas configuradas. Los equipos se
				siembran con la posición de la última jornada.
			</p>
			<button
				onClick={handleStart}
				disabled={loading}
				className="bg-brand hover:bg-brand-dim text-pitch font-bold text-sm px-5 py-2.5 rounded-lg transition-colors disabled:opacity-50"
			>
				{loading ? "Generando…" : "Iniciar Fase Final"}
			</button>
			{error && <p className="text-xs text-rose">{error}</p>}
		</div>
	);
}
