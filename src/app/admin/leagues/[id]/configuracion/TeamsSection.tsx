"use client";

/**
 * TeamsSection — Lista de equipos con opción de disolver
 *
 * Muestra equipos activos y disueltos por separado.
 * El botón "Disolver" abre un diálogo de confirmación antes de proceder.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/shared/hooks/use-toast";

type Team = {
	id: string;
	name: string;
	color: string | null;
	status: string;
};

type Props = {
	leagueId: string;
	teams: Team[];
};

const TEAM_COLOR_MAP: Record<string, string> = {
	red: "bg-red-500",
	orange: "bg-orange-500",
	yellow: "bg-yellow-400",
	green: "bg-green-600",
	blue: "bg-blue-600",
	purple: "bg-purple-600",
	pink: "bg-pink-500",
	gray: "bg-gray-400",
	black: "bg-gray-900",
	white: "bg-white border border-gray-300",
};

function TeamDot({ color }: { color: string | null }) {
	const cls = color ? (TEAM_COLOR_MAP[color] ?? "bg-gray-400") : "bg-gray-300";
	return <span className={`inline-block w-2.5 h-2.5 rounded-full flex-shrink-0 ${cls}`} />;
}

export function TeamsSection({ leagueId, teams: initialTeams }: Props) {
	const router = useRouter();
	const toast = useToast();

	const [teams, setTeams] = useState<Team[]>(initialTeams);
	const [confirmId, setConfirmId] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	const activeTeams = teams.filter((t) => t.status === "active");
	const disbandedTeams = teams.filter((t) => t.status === "disbanded");
	const confirmTeam = teams.find((t) => t.id === confirmId) ?? null;

	async function handleDisband() {
		if (!confirmId) return;
		setLoading(true);

		try {
			const res = await fetch(`/api/leagues/${leagueId}/teams/${confirmId}/disband`, {
				method: "POST",
			});
			const json = await res.json();

			if (!res.ok || !json.ok) {
				toast.error(json.error ?? "Error al disolver el equipo");
				return;
			}

			const { teamName, freedPlayers } = json.data as {
				teamName: string;
				freedPlayers: number;
			};

			// Update local state optimistically
			setTeams((prev) => prev.map((t) => (t.id === confirmId ? { ...t, status: "disbanded" } : t)));

			const playerMsg =
				freedPlayers === 1
					? "1 jugador quedó como agente libre"
					: freedPlayers > 1
						? `${freedPlayers} jugadores quedaron como agentes libres`
						: "";

			toast.success(
				playerMsg ? `"${teamName}" disuelto. ${playerMsg}.` : `"${teamName}" disuelto.`,
			);
			router.refresh();
		} catch {
			toast.error("Error de red. Intenta de nuevo.");
		} finally {
			setLoading(false);
			setConfirmId(null);
		}
	}

	return (
		<div className="bg-surface rounded-lg shadow p-4">
			<h2 className="text-sm font-semibold text-ink mb-1">Equipos</h2>
			<p className="text-xs text-ink-2 mb-3">
				Disolver un equipo lo excluye de la tabla, el sorteo y la siguiente temporada. Los datos
				históricos se conservan.
			</p>

			{/* ── Equipos activos ──────────────────────────────── */}
			{activeTeams.length === 0 ? (
				<p className="text-xs text-ink-3 italic">No hay equipos activos.</p>
			) : (
				<ul className="space-y-1.5">
					{activeTeams.map((team) => (
						<li
							key={team.id}
							className="flex items-center justify-between gap-2 py-1.5 px-2 rounded hover:bg-surface-2 transition-colors"
						>
							<span className="flex items-center gap-2 text-sm text-ink">
								<TeamDot color={team.color} />
								{team.name}
							</span>
							<button
								onClick={() => setConfirmId(team.id)}
								className="text-xs text-rose-600 hover:text-rose-700 font-medium shrink-0"
							>
								Disolver
							</button>
						</li>
					))}
				</ul>
			)}

			{/* ── Equipos disueltos ─────────────────────────────── */}
			{disbandedTeams.length > 0 && (
				<div className="mt-4 pt-3 border-t border-line">
					<p className="text-xs font-medium text-ink-3 mb-1.5">Disueltos</p>
					<ul className="space-y-1">
						{disbandedTeams.map((team) => (
							<li
								key={team.id}
								className="flex items-center gap-2 py-1 px-2 text-sm text-ink-3 line-through"
							>
								<TeamDot color={team.color} />
								{team.name}
							</li>
						))}
					</ul>
				</div>
			)}

			{/* ── Confirm Dialog ────────────────────────────────── */}
			{confirmId && confirmTeam && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
					<div className="bg-surface rounded-xl shadow-xl max-w-sm w-full mx-4 p-5 space-y-4">
						<div>
							<h3 className="text-base font-bold text-ink">
								¿Disolver &ldquo;{confirmTeam.name}&rdquo;?
							</h3>
							<p className="text-sm text-ink-2 mt-1">
								El equipo quedará excluido de la tabla de posiciones, el sorteo y la siguiente
								temporada. Los jugadores pasan a ser agentes libres. Esta acción no se puede
								deshacer.
							</p>
						</div>
						<div className="flex gap-2 justify-end">
							<button
								onClick={() => setConfirmId(null)}
								disabled={loading}
								className="px-3 py-1.5 text-sm rounded border border-line text-ink hover:bg-surface-2 disabled:opacity-50"
							>
								Cancelar
							</button>
							<button
								onClick={handleDisband}
								disabled={loading}
								className="px-3 py-1.5 text-sm rounded bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50 font-medium"
							>
								{loading ? "Disolviendo…" : "Sí, disolver"}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
