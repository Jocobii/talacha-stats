"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ExternalLink, CalendarDays } from "lucide-react";
import { AssignedVenueCard } from "./AssignedVenueCard";
import { UnassignedVenueTile } from "./UnassignedVenueTile";
import { MiniStat, parseMinutes } from "./VenueStatsStrip";
import type { VenueForLeague, Venue, VenueTimeWindow } from "@/entities/venue";

type LeagueVenuesClientProps = {
	leagueId: string;
	leagueName: string;
	leagueSeason: string;
	dayOfWeek: string;
	slotDuration: number;
	initialAssigned: VenueForLeague[];
	initialUnassigned: Venue[];
};

export function LeagueVenuesClient({
	leagueId,
	leagueName,
	leagueSeason,
	dayOfWeek,
	slotDuration,
	initialAssigned,
	initialUnassigned,
}: LeagueVenuesClientProps) {
	const [assigned, setAssigned] = useState<VenueForLeague[]>(initialAssigned);
	const [unassigned, setUnassigned] = useState<Venue[]>(initialUnassigned);

	const totalWindows = assigned.reduce((s, v) => s + v.windows.length, 0);
	const totalSlots = assigned.reduce(
		(s, v) =>
			s +
			v.windows.reduce(
				(ws, w) =>
					ws + Math.floor((parseMinutes(w.endTime) - parseMinutes(w.startTime)) / slotDuration),
				0,
			),
		0,
	);

	function handleAssigned(venue: Venue) {
		setUnassigned((prev) => prev.filter((v) => v.id !== venue.id));
		setAssigned((prev) => [...prev, { ...venue, priority: prev.length + 1, windows: [] }]);
	}

	function handleUnassigned(venueId: string) {
		const removed = assigned.find((v) => v.id === venueId);
		setAssigned((prev) => prev.filter((v) => v.id !== venueId));
		if (removed) {
			setUnassigned((prev) => [
				...prev,
				{
					id: removed.id,
					name: removed.name,
					address: removed.address,
					city: removed.city,
					color: removed.color,
					capacity: removed.capacity,
					notes: removed.notes,
					nameCanonical: "",
					organizationId: "",
					createdAt: new Date(),
				},
			]);
		}
	}

	function handleWindowsChanged(venueId: string, windows: VenueTimeWindow[]) {
		setAssigned((prev) => prev.map((v) => (v.id === venueId ? { ...v, windows } : v)));
	}

	return (
		<div>
			<div className="mb-1">
				<Link
					href={`/admin/leagues/${leagueId}/sorteo`}
					className="inline-flex items-center gap-1.5 text-[12.5px] text-ink-2 hover:text-ink transition"
				>
					<ChevronLeft size={13} /> Módulo de sorteo
				</Link>
			</div>

			<div className="flex items-start justify-between gap-4 mb-5">
				<div>
					<h1
						className="text-[32px] leading-none font-black tracking-tight text-ink"
						style={{ fontFamily: "var(--font-display)" }}
					>
						Canchas de esta liga
					</h1>
					<p className="text-[13px] text-ink-2 mt-2">
						{leagueName} — {leagueSeason} · Asigna canchas del pool y configura sus ventanas
						horarias.
					</p>
				</div>
				<div className="flex items-center gap-2.5 shrink-0">
					<Link
						href="/admin/canchas"
						className="inline-flex items-center gap-1.5 text-[12.5px] text-ink-2 hover:text-ink transition"
					>
						<ExternalLink size={12} /> Administrar pool de canchas
					</Link>
					<Link
						href="/admin/venues/calendar"
						className="flex items-center gap-1.5 h-9 px-3 text-[13px] font-semibold text-ink-2 border border-line rounded-lg hover:bg-surface hover:text-ink transition"
					>
						<CalendarDays size={14} /> Ver calendario
					</Link>
				</div>
			</div>

			<div className="flex items-start gap-3 p-3 bg-blue-500/5 border border-blue-500/18 rounded-lg mb-5 text-[12.5px] text-ink-2 leading-relaxed">
				<div className="w-6 h-6 rounded-full bg-blue-500/15 text-blue-400 grid place-items-center font-bold text-[12px] shrink-0 mt-0.5">
					i
				</div>
				<p>
					Las canchas se registran <strong className="text-ink">una sola vez</strong> en el módulo
					global y se asignan a cada liga. Aquí defines en qué horarios están disponibles para esta
					liga.
				</p>
			</div>

			<div className="grid grid-cols-4 gap-3 mb-6">
				<MiniStat label="Asignadas" value={String(assigned.length)} />
				<MiniStat label="Ventanas configuradas" value={String(totalWindows)} />
				<MiniStat
					label="Slots por jornada"
					value={String(totalSlots)}
					sub={`con duración ${slotDuration} min`}
					accent
				/>
				<MiniStat label="Capacidad / jornada" value={`${totalSlots} partidos`} />
			</div>

			<div className="flex items-baseline justify-between mb-3">
				<h2
					className="text-[22px] font-bold text-ink"
					style={{ fontFamily: "var(--font-display)" }}
				>
					Asignadas <span className="text-ink-3 font-semibold">· {assigned.length}</span>
				</h2>
				<span className="text-[12px] text-ink-3 italic">
					Click en un slot vacío para agregar una ventana
				</span>
			</div>

			<div className="flex flex-col gap-3.5 mb-8">
				{assigned.map((v) => (
					<AssignedVenueCard
						key={v.id}
						venue={v}
						leagueId={leagueId}
						dayOfWeek={dayOfWeek}
						slotDuration={slotDuration}
						onUnassign={handleUnassigned}
						onWindowsChanged={handleWindowsChanged}
					/>
				))}
				{assigned.length === 0 && (
					<p className="text-center py-8 text-[13px] text-ink-3">
						No hay canchas asignadas a esta liga.
					</p>
				)}
			</div>

			<div className="flex items-baseline mb-3">
				<h2
					className="text-[22px] font-bold text-ink"
					style={{ fontFamily: "var(--font-display)" }}
				>
					Disponibles en tu organización{" "}
					<span className="text-ink-3 font-semibold">· {unassigned.length}</span>
				</h2>
			</div>

			<div className="grid grid-cols-3 gap-3">
				{unassigned.map((v) => (
					<UnassignedVenueTile
						key={v.id}
						venue={v}
						leagueId={leagueId}
						onAssigned={handleAssigned}
					/>
				))}
				<Link
					href="/admin/canchas?action=new"
					className="bg-transparent border border-dashed border-line rounded-lg p-3.5 flex items-center justify-center gap-2 text-[13px] font-semibold text-brand-ink hover:bg-brand/5 hover:border-brand/40 transition"
				>
					<span className="text-brand-ink">+</span> Registrar nueva cancha
				</Link>
			</div>
		</div>
	);
}
