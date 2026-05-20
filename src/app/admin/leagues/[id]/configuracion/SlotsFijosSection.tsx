"use client";

import { useState } from "react";
import { Lock, Plus, Trash2, Pencil, X, Check } from "lucide-react";
import { TeamBadge } from "@/shared/ui";

type Team = { id: string; name: string; color: string | null };
type Venue = { id: string; name: string; slots: string[] };
export type SlotRow = {
	id: string;
	teamId: string;
	teamName: string;
	teamColor: string | null;
	venueId: string | null;
	venueName: string | null;
	startTime: string;
};

type Props = {
	leagueId: string;
	teams: Team[];
	venues: Venue[];
	initialSlots: SlotRow[];
};

/** Fallback solo si la liga no tiene canchas configuradas con ventanas horarias. */
const DEFAULT_TIMES = ["17:00", "18:00", "19:00", "20:00", "21:00", "22:00"];

const selectCls =
	"text-sm bg-pitch border border-line text-ink rounded-lg px-3 py-1.5 focus:outline-none focus:border-brand/60";

// ── Formulario inline (add o edit) ───────────────────────────────────────────

function SlotForm({
	teams,
	venues,
	initial,
	onSave,
	onCancel,
}: {
	teams: Team[];
	venues: Venue[];
	initial?: Partial<SlotRow>;
	onSave: (data: { teamId: string; venueId: string | null; startTime: string }) => Promise<void>;
	onCancel: () => void;
}) {
	const [teamId, setTeamId] = useState(initial?.teamId ?? "");
	const [venueId, setVenueId] = useState(initial?.venueId ?? "");
	const [startTime, setStartTime] = useState(initial?.startTime ?? "");
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const selectedVenue = venues.find((v) => v.id === venueId);

	// Cuando no hay cancha seleccionada: unión de todos los slots de todas las canchas
	// (ya computados en el server con matchDurationMinutes + bufferMinutes).
	// Solo cae a DEFAULT_TIMES si la liga no tiene canchas configuradas.
	const allVenueSlots = [...new Set(venues.flatMap((v) => v.slots))].sort();
	const fallbackSlots = allVenueSlots.length ? allVenueSlots : DEFAULT_TIMES;
	const timeSlots = selectedVenue?.slots.length ? selectedVenue.slots : fallbackSlots;

	async function handleSubmit() {
		if (!teamId || !startTime) return;
		setSaving(true);
		setError(null);
		try {
			await onSave({ teamId, venueId: venueId || null, startTime });
		} catch (e) {
			setError(e instanceof Error ? e.message : "Error al guardar");
		} finally {
			setSaving(false);
		}
	}

	return (
		<div className="flex flex-wrap items-center gap-2 p-3 bg-surface-2 rounded-lg border border-line">
			{teams.length > 1 && (
				<select value={teamId} onChange={(e) => setTeamId(e.target.value)} className={selectCls}>
					<option value="">Equipo…</option>
					{teams.map((t) => (
						<option key={t.id} value={t.id}>
							{t.name}
						</option>
					))}
				</select>
			)}
			<select value={venueId} onChange={(e) => setVenueId(e.target.value)} className={selectCls}>
				<option value="">Sin cancha fija</option>
				{venues.map((v) => (
					<option key={v.id} value={v.id}>
						{v.name}
					</option>
				))}
			</select>
			<select
				value={startTime}
				onChange={(e) => setStartTime(e.target.value)}
				className={selectCls}
			>
				<option value="">Hora…</option>
				{timeSlots.map((h) => (
					<option key={h} value={h}>
						{h}
					</option>
				))}
			</select>
			<button
				onClick={handleSubmit}
				disabled={saving || !teamId || !startTime}
				className="btn-primary px-3 py-1.5 text-sm"
				title="Guardar"
			>
				<Check size={13} />
			</button>
			<button onClick={onCancel} className="btn-ghost px-3 py-1.5 text-sm" title="Cancelar">
				<X size={13} />
			</button>
			{error && <p className="w-full text-xs text-rose-400">{error}</p>}
		</div>
	);
}

// ── Sección principal ─────────────────────────────────────────────────────────

export function SlotsFijosSection({ leagueId, teams, venues, initialSlots }: Props) {
	const [slots, setSlots] = useState<SlotRow[]>(initialSlots);
	const [adding, setAdding] = useState(false);
	const [editId, setEditId] = useState<string | null>(null);

	const teamsWithoutSlot = teams.filter((t) => !slots.some((s) => s.teamId === t.id));

	async function handleAdd(data: { teamId: string; venueId: string | null; startTime: string }) {
		const today = new Date().toISOString().slice(0, 10);
		const res = await fetch(`/api/leagues/${leagueId}/purchased-timeslots`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ ...data, leagueId, activeFromDate: today }),
		});
		const json = (await res.json()) as { ok: boolean; data?: { id: string }; error?: string };
		if (!json.ok) throw new Error(json.error ?? "Error al guardar");
		const team = teams.find((t) => t.id === data.teamId)!;
		const venue = venues.find((v) => v.id === data.venueId) ?? null;
		setSlots((prev) => [
			...prev,
			{
				id: json.data!.id,
				teamId: team.id,
				teamName: team.name,
				teamColor: team.color,
				venueId: data.venueId,
				venueName: venue?.name ?? null,
				startTime: data.startTime,
			},
		]);
		setAdding(false);
	}

	async function handleEdit(
		slotId: string,
		data: { teamId: string; venueId: string | null; startTime: string },
	) {
		const res = await fetch(`/api/purchased-timeslots/${slotId}`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ venueId: data.venueId, startTime: data.startTime }),
		});
		const json = (await res.json()) as { ok: boolean; error?: string };
		if (!json.ok) throw new Error(json.error ?? "Error al actualizar");
		const venue = venues.find((v) => v.id === data.venueId) ?? null;
		setSlots((prev) =>
			prev.map((s) =>
				s.id === slotId
					? {
							...s,
							venueId: data.venueId,
							venueName: venue?.name ?? null,
							startTime: data.startTime,
						}
					: s,
			),
		);
		setEditId(null);
	}

	async function handleDelete(slotId: string) {
		if (!confirm("¿Eliminar este slot fijo?")) return;
		const res = await fetch(`/api/purchased-timeslots/${slotId}`, { method: "DELETE" });
		const json = (await res.json()) as { ok: boolean };
		if (!json.ok) return;
		setSlots((prev) => prev.filter((s) => s.id !== slotId));
	}

	return (
		<div className="bg-surface rounded-lg shadow p-4">
			<div className="flex items-start justify-between gap-4 mb-4">
				<div>
					<h2 className="text-sm font-semibold text-ink flex items-center gap-1.5">
						<Lock size={13} className="text-blue-400" /> Slots fijos comprados
					</h2>
					<p className="text-xs text-ink-2 mt-1">
						El sorteo respeta estos horarios automáticamente en cada jornada.
					</p>
				</div>
				{teamsWithoutSlot.length > 0 && !adding && (
					<button className="btn-ghost text-xs px-3 py-1.5" onClick={() => setAdding(true)}>
						<Plus size={12} /> Agregar
					</button>
				)}
			</div>

			<div className="flex flex-col gap-2">
				{slots.length === 0 && !adding && (
					<p className="text-center py-5 text-xs text-ink-3">
						Ningún equipo tiene slot comprado.{" "}
						<button className="text-brand hover:underline" onClick={() => setAdding(true)}>
							Agregar primero
						</button>
					</p>
				)}

				{slots.map((slot) =>
					editId === slot.id ? (
						<SlotForm
							key={slot.id}
							teams={[teams.find((t) => t.id === slot.teamId)!]}
							venues={venues}
							initial={slot}
							onSave={(data) => handleEdit(slot.id, data)}
							onCancel={() => setEditId(null)}
						/>
					) : (
						<div
							key={slot.id}
							className="flex items-center gap-3 px-3 py-2 bg-surface-2 rounded-lg"
						>
							<TeamBadge
								teamId={slot.teamId}
								name={slot.teamName}
								color={slot.teamColor}
								size="sm"
							/>
							<span className="flex-1 text-sm text-ink font-medium truncate">{slot.teamName}</span>
							<span className="text-xs text-ink-2 shrink-0">
								{slot.venueName ?? "Cualquier cancha"}
							</span>
							<span className="text-xs font-mono text-brand shrink-0 w-12 text-right">
								{slot.startTime}
							</span>
							<button
								className="btn-ghost px-2 py-1"
								onClick={() => setEditId(slot.id)}
								title="Editar"
							>
								<Pencil size={11} />
							</button>
							<button
								className="btn-ghost px-2 py-1"
								onClick={() => handleDelete(slot.id)}
								title="Eliminar"
							>
								<Trash2 size={11} />
							</button>
						</div>
					),
				)}

				{adding && (
					<SlotForm
						teams={teamsWithoutSlot}
						venues={venues}
						onSave={handleAdd}
						onCancel={() => setAdding(false)}
					/>
				)}
			</div>
		</div>
	);
}
