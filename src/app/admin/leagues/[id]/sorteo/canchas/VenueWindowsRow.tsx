"use client";

/**
 * VenueWindowsRow — Fila expandible de una cancha asignada con gestión de ventanas horarias.
 * Sub-componente atómico de VenuesPanel (sección 2).
 */

import { useState } from "react";
import { Plus, Trash2, Clock, ChevronDown, ChevronUp } from "lucide-react";
import type { VenueForLeague } from "@/entities/venue/model";

const DAYS = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"] as const;

type Window = VenueForLeague["windows"][number];

type Props = {
	leagueId: string;
	venue: VenueForLeague;
	onWindowAdded: (venueId: string, window: Window) => void;
	onWindowDeleted: (venueId: string, windowId: string) => void;
};

export function VenueWindowsRow({ leagueId, venue, onWindowAdded, onWindowDeleted }: Props) {
	const [open, setOpen] = useState(false);
	const [day, setDay] = useState<string>("lunes");
	const [start, setStart] = useState("18:00");
	const [end, setEnd] = useState("22:00");
	const [error, setError] = useState<string | null>(null);

	async function handleAdd() {
		setError(null);
		const res = await fetch(`/api/leagues/${leagueId}/venues/${venue.id}/windows`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ dayOfWeek: day, startTime: start, endTime: end }),
		});
		const json = await res.json();
		if (!res.ok) {
			setError(json.error ?? "Error");
			return;
		}
		onWindowAdded(venue.id, json.data);
	}

	async function handleDelete(windowId: string) {
		const res = await fetch(`/api/venue-windows/${windowId}`, { method: "DELETE" });
		if (res.ok) onWindowDeleted(venue.id, windowId);
	}

	return (
		<div>
			<button
				onClick={() => setOpen(!open)}
				className="w-full flex items-center justify-between px-5 py-3 hover:bg-surface-2 transition-colors"
			>
				<div className="flex items-center gap-3">
					<Clock size={16} className="text-ink-2" />
					<span className="font-medium text-ink text-sm">{venue.name}</span>
					<span className="text-xs text-ink-3 bg-surface-2 px-2 py-0.5 rounded-full">
						{venue.windows.length} ventana{venue.windows.length !== 1 ? "s" : ""}
					</span>
				</div>
				{open ? (
					<ChevronUp size={16} className="text-ink-2" />
				) : (
					<ChevronDown size={16} className="text-ink-2" />
				)}
			</button>

			{open && (
				<div className="px-5 pb-4 space-y-3 bg-surface-2/30">
					{venue.windows.length > 0 && (
						<ul className="space-y-1 mt-2">
							{venue.windows.map((w) => (
								<li
									key={w.id}
									className="flex items-center justify-between bg-surface rounded px-3 py-2 text-sm"
								>
									<span className="capitalize text-ink-2 w-24">{w.dayOfWeek}</span>
									<span className="font-mono text-ink">
										{w.startTime} – {w.endTime}
									</span>
									<button
										onClick={() => handleDelete(w.id)}
										className="text-red-400 hover:text-red-600"
									>
										<Trash2 size={14} />
									</button>
								</li>
							))}
						</ul>
					)}
					<div className="flex gap-2 flex-wrap items-end pt-1">
						<div className="flex flex-col gap-1">
							<label className="text-xs text-ink-2">Día</label>
							<select
								value={day}
								onChange={(e) => setDay(e.target.value)}
								className="border border-line rounded px-2 py-1.5 text-sm capitalize"
							>
								{DAYS.map((d) => (
									<option key={d} value={d} className="capitalize">
										{d}
									</option>
								))}
							</select>
						</div>
						<div className="flex flex-col gap-1">
							<label className="text-xs text-ink-2">Inicio</label>
							<input
								type="time"
								value={start}
								onChange={(e) => setStart(e.target.value)}
								className="border border-line rounded px-2 py-1.5 text-sm font-mono"
							/>
						</div>
						<div className="flex flex-col gap-1">
							<label className="text-xs text-ink-2">Fin</label>
							<input
								type="time"
								value={end}
								onChange={(e) => setEnd(e.target.value)}
								className="border border-line rounded px-2 py-1.5 text-sm font-mono"
							/>
						</div>
						<button
							onClick={handleAdd}
							className="flex items-center gap-1 bg-brand text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-brand/90"
						>
							<Plus size={14} /> Agregar ventana
						</button>
					</div>
					{error && <p className="text-xs text-red-500">{error}</p>}
				</div>
			)}
		</div>
	);
}
