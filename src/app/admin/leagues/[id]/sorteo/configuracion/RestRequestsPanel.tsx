"use client";

/**
 * RestRequestsPanel — Gestiona solicitudes de descanso (S3).
 * POST /api/leagues/[id]/rest-requests  → agregar
 * DELETE /api/rest-requests/[id]        → eliminar
 */

import { useState } from "react";
import { Plus, Trash2, Loader2, Coffee } from "lucide-react";
import type { TeamRestRequest } from "@/db/schema";

type Team = { id: string; name: string };

type Props = {
	leagueId: string;
	teams: Team[];
	initialRequests: TeamRestRequest[];
	maxMatchday: number;
};

export function RestRequestsPanel({ leagueId, teams, initialRequests, maxMatchday }: Props) {
	const [requests, setRequests] = useState<TeamRestRequest[]>(initialRequests);
	const [teamId, setTeamId] = useState(teams[0]?.id ?? "");
	const [matchdayNumber, setMatchdayNumber] = useState(1);
	const [reason, setReason] = useState("");
	const [adding, setAdding] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [deletingId, setDeletingId] = useState<string | null>(null);

	const teamMap = Object.fromEntries(teams.map((t) => [t.id, t.name]));

	async function handleAdd(e: React.FormEvent) {
		e.preventDefault();
		setAdding(true);
		setError(null);
		try {
			const res = await fetch(`/api/leagues/${leagueId}/rest-requests`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ teamId, matchdayNumber, reason: reason || undefined }),
			});
			const json = await res.json();
			if (!res.ok) throw new Error(json.error ?? "Error al agregar descanso");
			setRequests((prev) =>
				[...prev, json.data].sort((a, b) => a.matchdayNumber - b.matchdayNumber),
			);
			setReason("");
		} catch (e) {
			setError(e instanceof Error ? e.message : "Error");
		} finally {
			setAdding(false);
		}
	}

	async function handleDelete(id: string) {
		setDeletingId(id);
		const res = await fetch(`/api/rest-requests/${id}`, { method: "DELETE" });
		if (res.ok) {
			setRequests((prev) => prev.filter((r) => r.id !== id));
		}
		setDeletingId(null);
	}

	return (
		<section className="bg-surface rounded-lg shadow">
			<div className="px-5 py-4 border-b border-line">
				<h2 className="font-semibold text-ink flex items-center gap-2">
					<Coffee size={16} className="text-ink-2" />
					Descansos solicitados (S3)
				</h2>
				<p className="text-xs text-ink-2 mt-0.5">
					Un equipo con descanso en una jornada recibirá BYE en el sorteo
				</p>
			</div>
			<div className="p-5 space-y-4">
				{teams.length === 0 ? (
					<p className="text-sm text-ink-3 text-center py-4">Sin equipos en la liga</p>
				) : (
					<form onSubmit={handleAdd} className="flex gap-2 flex-wrap items-end">
						<div className="flex flex-col gap-1">
							<label className="text-xs text-ink-2">Equipo</label>
							<select
								value={teamId}
								onChange={(e) => setTeamId(e.target.value)}
								className="border border-line rounded px-3 py-1.5 text-sm min-w-36"
							>
								{teams.map((t) => (
									<option key={t.id} value={t.id}>
										{t.name}
									</option>
								))}
							</select>
						</div>
						<div className="flex flex-col gap-1">
							<label className="text-xs text-ink-2">Jornada</label>
							<input
								type="number"
								min={1}
								max={maxMatchday}
								value={matchdayNumber}
								onChange={(e) => setMatchdayNumber(Number(e.target.value))}
								className="border border-line rounded px-3 py-1.5 text-sm w-20"
							/>
						</div>
						<div className="flex flex-col gap-1 flex-1 min-w-40">
							<label className="text-xs text-ink-2">Motivo (opcional)</label>
							<input
								value={reason}
								onChange={(e) => setReason(e.target.value)}
								placeholder="ej. viaje de fin de semana"
								className="border border-line rounded px-3 py-1.5 text-sm"
							/>
						</div>
						<button
							type="submit"
							disabled={adding || !teamId}
							className="flex items-center gap-1 bg-brand text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-brand/90 disabled:opacity-50"
						>
							{adding ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
							Agregar
						</button>
					</form>
				)}
				{error && <p className="text-xs text-red-500">{error}</p>}

				{requests.length === 0 ? (
					<p className="text-sm text-ink-3 text-center py-4">Sin descansos registrados</p>
				) : (
					<table className="w-full text-sm">
						<thead className="bg-surface-2 text-ink-2 text-xs uppercase">
							<tr>
								<th className="px-3 py-2 text-left">Equipo</th>
								<th className="px-3 py-2 text-center">Jornada</th>
								<th className="px-3 py-2 text-left">Motivo</th>
								<th className="px-3 py-2 w-10" />
							</tr>
						</thead>
						<tbody className="divide-y divide-line">
							{requests.map((r) => (
								<tr key={r.id} className="hover:bg-surface-2">
									<td className="px-3 py-2 font-medium">{teamMap[r.teamId] ?? r.teamId}</td>
									<td className="px-3 py-2 text-center">J{r.matchdayNumber}</td>
									<td className="px-3 py-2 text-ink-2">{r.reason ?? "—"}</td>
									<td className="px-3 py-2">
										<button
											onClick={() => handleDelete(r.id)}
											disabled={deletingId === r.id}
											className="text-red-400 hover:text-red-600 disabled:opacity-40"
										>
											{deletingId === r.id ? (
												<Loader2 size={14} className="animate-spin" />
											) : (
												<Trash2 size={14} />
											)}
										</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				)}
			</div>
		</section>
	);
}
