"use client";

/**
 * features/team-management/ui/DeleteTeamSection.tsx
 * Zona de peligro N3: disolver equipo con confirmacion por nombre.
 * Solo visible para rol admin — la pagina padre controla la visibilidad.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/shared/ui/Button";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { TEAM_API_URL } from "../constants";

type Props = {
	teamId: string;
	teamName: string;
	leagueId: string;
};

export function DeleteTeamSection({ teamId, teamName, leagueId }: Props) {
	const [showConfirm, setShowConfirm] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const router = useRouter();

	async function handleDelete() {
		setLoading(true);
		setError("");
		try {
			const res = await fetch(TEAM_API_URL(teamId), {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ confirm: teamName }),
			});
			const data = (await res.json()) as { ok: boolean; error?: string };
			if (!data.ok) {
				setError(data.error ?? "Error al disolver el equipo");
				return;
			}
			router.push(`/admin/leagues/${leagueId}`);
		} finally {
			setLoading(false);
			setShowConfirm(false);
		}
	}

	return (
		<>
			<div className="mt-8 p-5 rounded-lg border border-red-500/30 bg-red-500/5">
				<h4 className="text-[13px] font-semibold text-red-400 mb-1">Zona de peligro</h4>
				<p className="text-[12px] text-ink-2 mb-4 leading-relaxed">
					Disolver el equipo libera a todos los jugadores (quedan como agente libre en la liga). Las
					estadisticas de la temporada se preservan. Esta accion no puede deshacerse.
				</p>
				{error && <p className="text-[12px] text-red-400 mb-3">{error}</p>}
				<Button variant="danger" size="sm" icon={Trash2} onClick={() => setShowConfirm(true)}>
					Disolver equipo
				</Button>
			</div>

			{showConfirm && (
				<ConfirmDialog
					title={`Disolver "${teamName}"`}
					description="Todos los jugadores quedaran como agente libre. Las estadisticas de partidos jugados se preservan."
					dangerInput={teamName}
					confirmLabel="Disolver equipo"
					onConfirm={handleDelete}
					onClose={() => setShowConfirm(false)}
					loading={loading}
				/>
			)}
		</>
	);
}
