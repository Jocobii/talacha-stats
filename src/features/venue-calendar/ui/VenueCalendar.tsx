"use client";

/**
 * features/venue-calendar/ui/VenueCalendar.tsx
 * Orquestador del calendario de canchas. ≤ 80 líneas.
 * Toda la lógica vive en useVenueCalendar.
 */

import { useMemo } from "react";
import { ChevronLeft, ChevronRight, Info } from "lucide-react";
import { useVenueCalendar, addDays } from "../model/useVenueCalendar";
import { VenueSelector } from "./VenueSelector";
import { SummaryStrip } from "./SummaryStrip";
import { CalendarGrid } from "./CalendarGrid";
import { RentalModal } from "./RentalModal";
import { EventPopover } from "./EventPopover";
import type { VenueEvent, VenueSummary } from "../types";

type Props = { venues: VenueSummary[] };

const LEGEND = [
	{ key: "tournament", label: "Torneo", color: "#2563eb" },
	{ key: "rental_confirmed", label: "Confirmada", color: "#16a34a" },
	{ key: "rental_tentative", label: "Tentativa", color: "#d97706" },
	{ key: "rental_cancelled", label: "Cancelada", color: "#6b7280" },
];

export function VenueCalendar({ venues }: Props) {
	const cal = useVenueCalendar(venues[0]!.id);
	const today = useMemo(() => new Date(), []);

	const weekLabel = useMemo(() => {
		const end = addDays(cal.weekStart, 6);
		const month = (d: Date) => d.toLocaleDateString("es-MX", { month: "long" });
		if (cal.weekStart.getMonth() === end.getMonth())
			return `${cal.weekStart.getDate()} – ${end.getDate()} de ${month(cal.weekStart)} ${end.getFullYear()}`;
		return `${cal.weekStart.getDate()} ${month(cal.weekStart)} – ${end.getDate()} ${month(end)} ${end.getFullYear()}`;
	}, [cal.weekStart]);

	function onEventClick(ev: VenueEvent, el: HTMLElement) {
		cal.popover.open(ev, el);
	}

	function onSelectRange(start: string, end: string) {
		cal.modal.openCreate(start, end);
	}

	return (
		<div className="space-y-4">
			<SummaryStrip events={cal.events} />

			<section
				className="rounded-xl border border-line overflow-hidden"
				style={{ background: "var(--color-surface)" }}
			>
				{/* Panel head: venue selector + legend + view toggle */}
				<div className="px-4 py-3 border-b border-line flex items-center justify-between gap-3 flex-wrap">
					<div className="flex items-center gap-3 flex-wrap">
						<VenueSelector
							venues={venues}
							selectedId={cal.selectedVenueId}
							onChange={cal.setSelectedVenueId}
							disabled={cal.isSaving}
						/>
						<div className="flex items-center gap-3 flex-wrap text-[11px] text-ink-2">
							{LEGEND.map((l) => (
								<span key={l.key} className="flex items-center gap-1.5">
									<span
										className="w-2 h-2 rounded-[3px] inline-block"
										style={{ background: l.color }}
									/>
									{l.label}
								</span>
							))}
						</div>
					</div>
					{/* Segmented view control */}
					<div
						className="flex items-center p-0.5 rounded-lg border border-line gap-0.5"
						style={{ background: "var(--color-surface-2)" }}
					>
						{(["week", "day"] as const).map((v) => (
							<button
								key={v}
								onClick={() => cal.setView(v)}
								className="px-3 py-1 rounded-md text-[12px] font-medium transition-colors"
								style={
									cal.view === v
										? { background: "var(--color-brand)", color: "var(--color-pitch)" }
										: { color: "var(--color-ink-2)" }
								}
							>
								{v === "week" ? "Semana" : "Día"}
							</button>
						))}
					</div>
				</div>

				{/* Toolbar: week navigation */}
				<div className="px-4 py-3 border-b border-line flex items-center justify-between gap-3 flex-wrap">
					<div className="flex items-center gap-2">
						<button
							onClick={() => cal.setWeekStart(addDays(cal.weekStart, -7))}
							aria-label="Semana anterior"
							className="w-8 h-8 grid place-items-center rounded-lg border border-line text-ink-2 hover:text-ink hover:border-ink-3 transition-colors"
							style={{ background: "var(--color-surface-2)" }}
						>
							<ChevronLeft size={15} />
						</button>
						<button
							onClick={() => cal.setWeekStart(addDays(cal.weekStart, 7))}
							aria-label="Semana siguiente"
							className="w-8 h-8 grid place-items-center rounded-lg border border-line text-ink-2 hover:text-ink hover:border-ink-3 transition-colors"
							style={{ background: "var(--color-surface-2)" }}
						>
							<ChevronRight size={15} />
						</button>
						<button
							onClick={() => cal.setWeekStart(addDays(today, 0))}
							className="px-3 py-1.5 rounded-lg text-[13px] border border-line text-ink-2 hover:text-ink hover:bg-surface-2 transition-colors"
						>
							Hoy
						</button>
					</div>
					<span className="text-ink font-display font-semibold text-xl capitalize">
						{weekLabel}
					</span>
					<div className="flex items-center gap-1.5 text-[12px] text-ink-2">
						<Info size={13} /> Arrastra sobre un espacio libre para crear una renta
					</div>
				</div>

				{/* Calendar grid */}
				<CalendarGrid
					events={cal.events}
					weekStart={cal.weekStart}
					today={today}
					activeEventId={cal.popover.event?.id}
					onSelectRange={onSelectRange}
					onEventClick={onEventClick}
				/>
			</section>

			{/* Bottom hint */}
			<p className="text-[11px] text-ink-2 flex items-center gap-1.5">
				<kbd className="bg-surface-2 border border-line rounded px-1.5 py-px text-[10px] text-ink">
					Esc
				</kbd>
				cierra modales · clic en un evento para ver detalle · arrastra sobre horas libres para crear
				renta
			</p>

			<RentalModal
				isOpen={cal.modal.isOpen}
				onClose={cal.modal.close}
				onSave={cal.handleCreate}
				onUpdate={(id, payload) => cal.handleUpdate(id, payload)}
				defaultStart={cal.modal.defaultStart}
				defaultEnd={cal.modal.defaultEnd}
				initialValues={cal.modal.editingEvent}
				isSaving={cal.isSaving}
				error={cal.error}
			/>

			<EventPopover
				event={cal.popover.event}
				anchorEl={cal.popover.anchorEl}
				isOpen={cal.popover.isOpen}
				onClose={cal.popover.close}
				onEdit={(ev) => {
					cal.popover.close();
					cal.modal.openEdit(ev);
				}}
				onDelete={cal.handleDelete}
			/>
		</div>
	);
}
