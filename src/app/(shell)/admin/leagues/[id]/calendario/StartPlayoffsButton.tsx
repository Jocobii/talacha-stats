"use client";
/**
 * StartPlayoffsButton.tsx
 *
 * Botón "Iniciar Fase Final" — abre un ConfirmDialog (tone="brand", ver
 * shared/ui/ConfirmDialog.tsx) en vez del confirm() nativo del navegador,
 * llama a POST /playoffs/start y recarga la página al tener éxito.
 *
 * Feedback obligatorio (AGENTS.md §7.2b): el error del backend (ej. "No hay
 * zonas de clasificación configuradas") se muestra por `notify.error` — antes
 * solo se guardaba en `error` y se pintaba en un <p> del panel de atrás, que
 * quedaba tapado por el propio ConfirmDialog (overlay fixed inset-0) porque
 * el diálogo se queda abierto tras un error. El toast sí es visible siempre,
 * encima del modal.
 */

import { useState } from "react";
import { Trophy } from "lucide-react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/shared/api/client";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { notify } from "@/shared/lib/notify";

type Props = { leagueId: string };

export function StartPlayoffsButton({ leagueId }: Props) {
	const router = useRouter();
	const [showConfirm, setShowConfirm] = useState(false);
	const [loading, setLoading] = useState(false);

	const handleStart = async () => {
		setLoading(true);
		try {
			const result = await apiFetch(`/api/leagues/${leagueId}/playoffs/start`, {
				method: "POST",
			});
			if (!result.ok) {
				notify.error(result.error ?? "Error al iniciar la fase final.");
				return;
			}
			setShowConfirm(false);
			notify.success("Fase final iniciada.");
			router.refresh();
		} catch (networkError) {
			console.error("[StartPlayoffsButton] start", networkError);
			notify.error("Error de red. Intenta de nuevo.");
		} finally {
			setLoading(false);
		}
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
				onClick={() => setShowConfirm(true)}
				disabled={loading}
				className="bg-brand hover:bg-brand-dim text-pitch font-bold text-sm px-5 py-2.5 rounded-lg transition-colors disabled:opacity-50"
			>
				{loading ? "Generando…" : "Iniciar Fase Final"}
			</button>

			{showConfirm && (
				<ConfirmDialog
					tone="brand"
					icon={Trophy}
					title="¿Iniciar la fase final?"
					description="Se generarán los brackets de eliminación directa para todas las zonas configuradas, sembrados con la posición de la última jornada."
					confirmLabel="Iniciar Fase Final"
					onConfirm={handleStart}
					onClose={() => setShowConfirm(false)}
					loading={loading}
				/>
			)}
		</div>
	);
}
