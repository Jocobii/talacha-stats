"use client";

/**
 * VenuesPanel — Gestión completa de canchas en la UI del sorteo.
 *
 * Sección 1: Canchas de la organización (crear + asignar/quitar)
 * Sección 2: Canchas asignadas + ventanas horarias (delegado a VenueWindowsRow)
 */

import { useState } from "react";
import { Plus, Link2, Link2Off, Loader2 } from "lucide-react";
import type { Venue } from "@/db/schema";
import type { VenueForLeague } from "@/entities/venue/model";
import { VenueWindowsRow } from "./VenueWindowsRow";

type Props = {
	leagueId: string;
	organizationId: string;
	initialOrgVenues: Venue[];
	initialLeagueVenues: VenueForLeague[];
};

export function VenuesPanel({
	leagueId,
	organizationId,
	initialOrgVenues,
	initialLeagueVenues,
}: Props) {
	const [orgVenues, setOrgVenues] = useState<Venue[]>(initialOrgVenues);
	const [leagueVenues, setLeagueVenues] = useState<VenueForLeague[]>(initialLeagueVenues);
	const [newName, setNewName] = useState("");
	const [newCity, setNewCity] = useState("");
	const [creating, setCreating] = useState(false);
	const [createError, setCreateError] = useState<string | null>(null);

	const assignedIds = new Set(leagueVenues.map((v) => v.id));

	async function handleCreateVenue(e: React.FormEvent) {
		e.preventDefault();
		setCreating(true);
		setCreateError(null);
		try {
			const res = await fetch("/api/venues", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name: newName, city: newCity || undefined, organizationId }),
			});
			const json = await res.json();
			if (!res.ok) throw new Error(json.error ?? "Error al crear cancha");
			setOrgVenues((prev) => [...prev, json.data].sort((a, b) => a.name.localeCompare(b.name)));
			setNewName("");
			setNewCity("");
		} catch (e) {
			setCreateError(e instanceof Error ? e.message : "Error");
		} finally {
			setCreating(false);
		}
	}

	async function handleAssign(venueId: string) {
		const res = await fetch(`/api/leagues/${leagueId}/venues`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ venueId }),
		});
		const json = await res.json();
		if (!res.ok) {
			alert(json.error ?? "Error al asignar");
			return;
		}
		const venue = orgVenues.find((v) => v.id === venueId)!;
		setLeagueVenues((prev) => [
			...prev,
			{
				id: venue.id,
				name: venue.name,
				city: venue.city ?? null,
				notes: venue.notes ?? null,
				priority: 1,
				windows: [],
			},
		]);
	}

	async function handleUnassign(venueId: string) {
		const res = await fetch(`/api/leagues/${leagueId}/venues/${venueId}`, { method: "DELETE" });
		if (!res.ok) {
			const j = await res.json();
			alert(j.error ?? "Error");
			return;
		}
		setLeagueVenues((prev) => prev.filter((v) => v.id !== venueId));
	}

	function handleWindowAdded(venueId: string, window: VenueForLeague["windows"][number]) {
		setLeagueVenues((prev) =>
			prev.map((v) => (v.id === venueId ? { ...v, windows: [...v.windows, window] } : v)),
		);
	}

	function handleWindowDeleted(venueId: string, windowId: string) {
		setLeagueVenues((prev) =>
			prev.map((v) =>
				v.id === venueId ? { ...v, windows: v.windows.filter((w) => w.id !== windowId) } : v,
			),
		);
	}

	return (
		<div className="space-y-6">
			{/* Sección 1: Canchas de la organización */}
			<section className="bg-surface rounded-lg shadow">
				<div className="px-5 py-4 border-b border-line">
					<h2 className="font-semibold text-ink">Canchas de la organización</h2>
					<p className="text-xs text-ink-2 mt-0.5">Canchas disponibles para asignar a ligas</p>
				</div>
				<div className="p-5 space-y-4">
					<form onSubmit={handleCreateVenue} className="flex gap-2 flex-wrap">
						<input
							value={newName}
							onChange={(e) => setNewName(e.target.value)}
							placeholder="Nombre de la cancha"
							required
							className="border border-line rounded px-3 py-1.5 text-sm flex-1 min-w-40"
						/>
						<input
							value={newCity}
							onChange={(e) => setNewCity(e.target.value)}
							placeholder="Ciudad (opcional)"
							className="border border-line rounded px-3 py-1.5 text-sm w-36"
						/>
						<button
							type="submit"
							disabled={creating}
							className="flex items-center gap-1 bg-brand text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-brand/90 disabled:opacity-50"
						>
							{creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
							Agregar
						</button>
					</form>
					{createError && <p className="text-xs text-red-500">{createError}</p>}

					{orgVenues.length === 0 ? (
						<p className="text-sm text-ink-3 text-center py-4">Sin canchas registradas</p>
					) : (
						<ul className="divide-y divide-line">
							{orgVenues.map((v) => (
								<li key={v.id} className="flex items-center justify-between py-2">
									<div>
										<span className="text-sm font-medium text-ink">{v.name}</span>
										{v.city && <span className="text-xs text-ink-3 ml-2">{v.city}</span>}
									</div>
									{assignedIds.has(v.id) ? (
										<button
											onClick={() => handleUnassign(v.id)}
											className="flex items-center gap-1 text-xs text-red-500 hover:underline"
										>
											<Link2Off size={13} /> Quitar
										</button>
									) : (
										<button
											onClick={() => handleAssign(v.id)}
											className="flex items-center gap-1 text-xs text-brand hover:underline"
										>
											<Link2 size={13} /> Asignar
										</button>
									)}
								</li>
							))}
						</ul>
					)}
				</div>
			</section>

			{/* Sección 2: Canchas asignadas + ventanas */}
			<section className="bg-surface rounded-lg shadow">
				<div className="px-5 py-4 border-b border-line">
					<h2 className="font-semibold text-ink">Canchas de esta liga</h2>
					<p className="text-xs text-ink-2 mt-0.5">
						Configura las ventanas horarias disponibles por cancha
					</p>
				</div>
				<div className="divide-y divide-line">
					{leagueVenues.length === 0 && (
						<p className="text-sm text-ink-3 text-center py-8">
							Sin canchas asignadas. Asigna al menos una cancha arriba.
						</p>
					)}
					{leagueVenues.map((v) => (
						<VenueWindowsRow
							key={v.id}
							leagueId={leagueId}
							venue={v}
							onWindowAdded={handleWindowAdded}
							onWindowDeleted={handleWindowDeleted}
						/>
					))}
				</div>
			</section>
		</div>
	);
}
