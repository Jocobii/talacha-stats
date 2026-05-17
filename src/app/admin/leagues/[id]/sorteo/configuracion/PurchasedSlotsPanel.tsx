"use client";

/**
 * PurchasedSlotsPanel — Gestiona horarios comprados (S7).
 * POST /api/leagues/[id]/purchased-timeslots  → agregar
 * DELETE /api/purchased-timeslots/[id]        → eliminar
 */

import { useState } from "react";
import { Plus, Trash2, Loader2, ShoppingCart } from "lucide-react";
import type { TeamPurchasedTimeslot } from "@/db/schema";

type Team = { id: string; name: string };
type VenueOption = { id: string; name: string };

type Props = {
	leagueId: string;
	teams: Team[];
	venues: VenueOption[];
	initialSlots: TeamPurchasedTimeslot[];
};

export function PurchasedSlotsPanel({ leagueId, teams, venues, initialSlots }: Props) {
	const [slots, setSlots] = useState<TeamPurchasedTimeslot[]>(initialSlots);
	const [teamId, setTeamId] = useState(teams[0]?.id ?? "");
	const [startTime, setStartTime] = useState("18:00");
	const [venueId, setVenueId] = useState<string>("");
	const [activeFromDate, setActiveFromDate] = useState(new Date().toISOString().slice(0, 10));
	const [notes, setNotes] = useState("");
	const [adding, setAdding] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [deletingId, setDeletingId] = useState<string | null>(null);

	const teamMap = Object.fromEntries(teams.map((t) => [t.id, t.name]));
	const venueMap = Object.fromEntries(venues.map((v) => [v.id, v.name]));

	async function handleAdd(e: React.FormEvent) {
		e.preventDefault();
		setAdding(true);
		setError(null);
		try {
			const body: Record<string, unknown> = {
				teamId,
				startTime,
				activeFromDate,
				notes: notes || undefined,
			};
			if (venueId) body.venueId = venueId;

			const res = await fetch(`/api/leagues/${leagueId}/purchased-timeslots`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body),
			});
			const json = await res.json();
			if (!res.ok) throw new Error(json.error ?? "Error al agregar horario");
			setSlots((prev) =>
				[...prev, json.data].sort((a, b) => a.startTime.localeCompare(b.startTime)),
			);
			setNotes("");
		} catch (e) {
			setError(e instanceof Error ? e.message : "Error");
		} finally {
			setAdding(false);
		}
	}

	async function handleDelete(id: string) {
		setDeletingId(id);
		const res = await fetch(`/api/purchased-timeslots/${id}`, { method: "DELETE" });
		if (res.ok) setSlots((prev) => prev.filter((s) => s.id !== id));
		setDeletingId(null);
	}

	return (
		<section className="bg-surface rounded-lg shadow">
			<div className="px-5 py-4 border-b border-line">
				<h2 className="font-semibold text-ink flex items-center gap-2">
					<ShoppingCart size={16} className="text-ink-2" />
					Horarios comprados (S7)
				</h2>
				<p className="text-xs text-ink-2 mt-0.5">
					Restricción dura — el slot assigner prioriza estos horarios en el sorteo
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
							<label className="text-xs text-ink-2">Hora inicio</label>
							<input
								type="time"
								value={startTime}
								onChange={(e) => setStartTime(e.target.value)}
								required
								className="border border-line rounded px-3 py-1.5 text-sm font-mono"
							/>
						</div>
						<div className="flex flex-col gap-1">
							<label className="text-xs text-ink-2">Cancha (opcional)</label>
							<select
								value={venueId}
								onChange={(e) => setVenueId(e.target.value)}
								className="border border-line rounded px-3 py-1.5 text-sm min-w-32"
							>
								<option value="">Cualquier cancha</option>
								{venues.map((v) => (
									<option key={v.id} value={v.id}>
										{v.name}
									</option>
								))}
							</select>
						</div>
						<div className="flex flex-col gap-1">
							<label className="text-xs text-ink-2">Vigente desde</label>
							<input
								type="date"
								value={activeFromDate}
								onChange={(e) => setActiveFromDate(e.target.value)}
								required
								className="border border-line rounded px-3 py-1.5 text-sm"
							/>
						</div>
						<button
							type="submit"
							disabled={adding || !teamId}
							className="flex items-center gap-1 bg-brand text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-brand/90 disabled:opacity-50"
						>
							{adding ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
							Registrar
						</button>
					</form>
				)}
				{error && <p className="text-xs text-red-500">{error}</p>}

				{slots.length === 0 ? (
					<p className="text-sm text-ink-3 text-center py-4">Sin horarios comprados</p>
				) : (
					<table className="w-full text-sm">
						<thead className="bg-surface-2 text-ink-2 text-xs uppercase">
							<tr>
								<th className="px-3 py-2 text-left">Equipo</th>
								<th className="px-3 py-2 text-center">Hora</th>
								<th className="px-3 py-2 text-left">Cancha</th>
								<th className="px-3 py-2 text-left">Desde</th>
								<th className="px-3 py-2 w-10" />
							</tr>
						</thead>
						<tbody className="divide-y divide-line">
							{slots.map((s) => (
								<tr key={s.id} className="hover:bg-surface-2">
									<td className="px-3 py-2 font-medium">{teamMap[s.teamId] ?? s.teamId}</td>
									<td className="px-3 py-2 text-center font-mono">{s.startTime}</td>
									<td className="px-3 py-2 text-ink-2">
										{s.venueId ? (venueMap[s.venueId] ?? "—") : "Cualquiera"}
									</td>
									<td className="px-3 py-2 text-ink-2">{s.activeFromDate}</td>
									<td className="px-3 py-2">
										<button
											onClick={() => handleDelete(s.id)}
											disabled={deletingId === s.id}
											className="text-red-400 hover:text-red-600 disabled:opacity-40"
										>
											{deletingId === s.id ? (
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
