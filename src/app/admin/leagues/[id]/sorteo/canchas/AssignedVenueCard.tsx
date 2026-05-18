"use client";

import { useState } from "react";
import { MapPin, Pencil, Trash2, Plus, Copy } from "lucide-react";
import { WeeklyGrid, DAYS_FULL, slotCount } from "./WeeklyGrid";
import { NewWindowPopover } from "./NewWindowPopover";
import type { VenueForLeague, VenueTimeWindow } from "@/entities/venue";

type AssignedVenueCardProps = {
	venue: VenueForLeague;
	leagueId: string;
	dayOfWeek: string;
	slotDuration: number;
	onUnassign: (venueId: string) => void;
	onWindowsChanged: (venueId: string, windows: VenueTimeWindow[]) => void;
};

type PopoverTrigger =
	| { type: "none" }
	| { type: "create"; defaultDay: string; defaultHour: number }
	| { type: "edit"; window: VenueTimeWindow };

export function AssignedVenueCard({
	venue,
	leagueId,
	dayOfWeek,
	slotDuration,
	onUnassign,
	onWindowsChanged,
}: AssignedVenueCardProps) {
	const [windows, setWindows] = useState<VenueTimeWindow[]>(venue.windows);
	const [popover, setPopover] = useState<PopoverTrigger>({ type: "none" });
	const [confirmUnassign, setConfirmUnassign] = useState(false);

	const totalSlots = windows.reduce((s, w) => s + slotCount(w, slotDuration), 0);

	function upsertWindow(w: VenueTimeWindow) {
		setWindows((prev) => {
			const idx = prev.findIndex((p) => p.id === w.id);
			const next = idx >= 0 ? prev.with(idx, w) : [...prev, w];
			onWindowsChanged(venue.id, next);
			return next;
		});
		setPopover({ type: "none" });
	}

	function removeWindow(id: string) {
		setWindows((prev) => {
			const next = prev.filter((w) => w.id !== id);
			onWindowsChanged(venue.id, next);
			return next;
		});
		setPopover({ type: "none" });
	}

	async function handleUnassign() {
		const res = await fetch(`/api/leagues/${leagueId}/venues/${venue.id}`, { method: "DELETE" });
		const json = await res.json();
		if (json.ok) onUnassign(venue.id);
	}

	return (
		<article className="bg-surface border border-line rounded-xl overflow-hidden">
			{/* Card header */}
			<div className="flex items-center gap-3 px-4.5 py-3.5 border-b border-line">
				<div className="w-1 h-9 rounded-sm shrink-0" style={{ background: venue.color }} />
				<div className="flex-1 min-w-0">
					<h3
						className="text-[22px] leading-none font-bold text-ink tracking-tight"
						style={{ fontFamily: "var(--font-display)" }}
					>
						{venue.name}
					</h3>
					{venue.address && (
						<p className="flex items-center gap-1 mt-1.5 text-[12px] text-ink-2">
							<MapPin size={10} className="text-ink-3 shrink-0" />
							{venue.address}
						</p>
					)}
				</div>
				<span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-brand/10 text-brand">
					{windows.length} ventana{windows.length !== 1 ? "s" : ""}
				</span>
				<span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-surface-2 border border-line text-ink-2">
					{totalSlots} slots
				</span>
				<button className="w-7 h-7 grid place-items-center rounded-md border border-line text-ink-2 hover:text-ink hover:bg-surface-2 transition">
					<Pencil size={13} />
				</button>
				{confirmUnassign ? (
					<div className="flex items-center gap-1">
						<span className="text-[11.5px] text-red-400">¿Quitar?</span>
						<button
							onClick={handleUnassign}
							className="px-2 py-0.5 bg-red-500 text-white text-[11.5px] font-bold rounded-md"
						>
							Sí
						</button>
						<button
							onClick={() => setConfirmUnassign(false)}
							className="px-2 py-0.5 text-ink-3 text-[11.5px] hover:text-ink"
						>
							No
						</button>
					</div>
				) : (
					<button
						onClick={() => setConfirmUnassign(true)}
						className="w-7 h-7 grid place-items-center rounded-md border border-red-500/25 text-red-400 hover:bg-red-500/10 transition"
					>
						<Trash2 size={13} />
					</button>
				)}
			</div>

			{/* Body */}
			<div className="p-4">
				<div className="flex items-center gap-2 mb-3">
					<span className="text-[11px] font-semibold tracking-[0.14em] uppercase text-ink-3">
						Ventanas semanales
					</span>
					<span className="text-[11.5px] text-ink-3 italic">
						La liga juega los <strong className="text-ink-2 not-italic">{dayOfWeek}</strong>
					</span>
					<button
						onClick={() => setPopover({ type: "create", defaultDay: dayOfWeek, defaultHour: 19 })}
						className="ml-auto flex items-center gap-1 px-2.5 py-1 text-[12px] font-semibold text-ink-2 border border-line rounded-lg hover:text-ink hover:bg-surface-2 transition"
					>
						<Plus size={11} /> Agregar ventana
					</button>
				</div>

				<WeeklyGrid
					windows={windows}
					dayOfWeek={dayOfWeek}
					slotDuration={slotDuration}
					onSlotClick={(day, hour) =>
						setPopover({ type: "create", defaultDay: day, defaultHour: hour })
					}
					onWindowClick={(w) => setPopover({ type: "edit", window: w })}
				/>

				{/* Window chips */}
				{windows.length > 0 && (
					<div className="mt-3.5 flex flex-wrap gap-2">
						{windows.map((w) => (
							<WindowChip
								key={w.id}
								window={w}
								slotDuration={slotDuration}
								dayOfWeek={dayOfWeek}
								onEdit={() => setPopover({ type: "edit", window: w })}
								onDelete={() => removeWindow(w.id)}
							/>
						))}
					</div>
				)}
			</div>

			{/* Popover */}
			{popover.type !== "none" && (
				<NewWindowPopover
					leagueId={leagueId}
					slotDuration={slotDuration}
					mode={
						popover.type === "edit"
							? { type: "edit", window: popover.window }
							: {
									type: "create",
									venueId: venue.id,
									defaultDay: popover.defaultDay,
									defaultHour: popover.defaultHour,
								}
					}
					onClose={() => setPopover({ type: "none" })}
					onSuccess={upsertWindow}
					onDeleted={removeWindow}
				/>
			)}
		</article>
	);
}

function WindowChip({
	window: w,
	slotDuration,
	dayOfWeek,
	onEdit,
	onDelete,
}: {
	window: VenueTimeWindow;
	slotDuration: number;
	dayOfWeek: string;
	onEdit: () => void;
	onDelete: () => void;
}) {
	const slots = slotCount(w, slotDuration);
	const isMatchDay = w.dayOfWeek === dayOfWeek;
	return (
		<div className="flex items-center gap-2 px-2.5 py-1.5 bg-surface-2 border border-line rounded-lg">
			<span
				className={`w-1.5 h-1.5 rounded-full shrink-0 ${isMatchDay ? "bg-brand" : "bg-ink-3"}`}
			/>
			<span className="text-[12px] text-ink capitalize">{w.dayOfWeek}</span>
			<span className="text-[12.5px] font-bold text-ink" style={{ fontFamily: "var(--font-mono)" }}>
				{w.startTime}–{w.endTime}
			</span>
			<span className="text-[11px] text-ink-3">· {slots} slots</span>
			<button
				onClick={onEdit}
				className="w-5 h-5 grid place-items-center rounded text-ink-3 hover:text-ink"
			>
				<Copy size={10} />
			</button>
			<button
				onClick={onDelete}
				className="w-5 h-5 grid place-items-center rounded text-ink-3 hover:text-red-400"
			>
				<Trash2 size={10} />
			</button>
		</div>
	);
}
