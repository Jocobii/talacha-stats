/* eslint-disable react-hooks/refs */
"use client";

/**
 * features/venue-calendar/ui/VenueCalendar.tsx
 * Orquestador del calendario de canchas.
 * Motor: FullCalendar (timeGrid + interaction). Diseño: mockup profesional.
 */

import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { DateSelectArg, DateSpanApi, EventClickArg } from "@fullcalendar/core";
import type { RefObject } from "react";
import { ChevronLeft, ChevronRight, Info } from "lucide-react";
import { useVenueCalendar } from "../model/useVenueCalendar";
import { VenueSelector } from "./VenueSelector";
import { SummaryStrip } from "./SummaryStrip";
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

	function onEventClick(arg: EventClickArg): void {
		const venueEvent = arg.event.extendedProps.venueEvent as VenueEvent;
		cal.popover.open(venueEvent, arg.el as HTMLElement);
	}

	function onSelect(arg: DateSelectArg): void {
		cal.modal.openCreate(arg.startStr, arg.endStr);
	}

	/** Impide arrastrar sobre un slot ya ocupado por cualquier evento. */
	function selectAllow(info: DateSpanApi): boolean {
		const selStart = info.start;
		const selEnd = info.end;
		return !cal.displayEvents.some((ev) => {
			const evStart = new Date(ev.startAt);
			const evEnd = new Date(ev.endAt);
			// Solapamiento: evStart < selEnd  Y  evEnd > selStart
			return evStart < selEnd && evEnd > selStart;
		});
	}

	function goPrev(): void {
		cal.calendarRef.current?.getApi().prev();
	}
	function goNext(): void {
		cal.calendarRef.current?.getApi().next();
	}
	function goToday(): void {
		cal.calendarRef.current?.getApi().today();
	}
	function changeView(v: "week" | "day"): void {
		cal.calendarRef.current?.getApi().changeView(v === "week" ? "timeGridWeek" : "timeGridDay");
	}

	return (
		<div className="space-y-4">
			<SummaryStrip events={cal.displayEvents} />

			<section
				className="rounded-xl border border-line overflow-hidden"
				style={{ background: "var(--color-surface)" }}
			>
				{/* Panel head: venue selector + leyenda + control de vista */}
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
								onClick={() => changeView(v)}
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

				{/* Toolbar: navegación + título de semana */}
				<div className="px-4 py-3 border-b border-line flex items-center justify-between gap-3 flex-wrap">
					<div className="flex items-center gap-2">
						<button
							onClick={goPrev}
							aria-label="Semana anterior"
							className="w-8 h-8 grid place-items-center rounded-lg border border-line text-ink-2 hover:text-ink hover:border-ink-3 transition-colors"
							style={{ background: "var(--color-surface-2)" }}
						>
							<ChevronLeft size={15} />
						</button>
						<button
							onClick={goNext}
							aria-label="Semana siguiente"
							className="w-8 h-8 grid place-items-center rounded-lg border border-line text-ink-2 hover:text-ink hover:border-ink-3 transition-colors"
							style={{ background: "var(--color-surface-2)" }}
						>
							<ChevronRight size={15} />
						</button>
						<button
							onClick={goToday}
							className="px-3 py-1.5 rounded-lg text-[13px] border border-line text-ink-2 hover:text-ink hover:bg-surface-2 transition-colors"
						>
							Hoy
						</button>
					</div>
					<span className="text-ink font-display font-semibold text-xl capitalize">
						{cal.viewTitle}
					</span>
					<div className="flex items-center gap-1.5 text-[12px] text-ink-2">
						<Info size={13} /> Arrastra sobre un espacio libre para crear una renta
					</div>
				</div>

				{/* FullCalendar */}
				<div className="vcal-fc-wrap">
					{/*
				  calendarRef: el hook usa CalendarHandle (duck-type) para no importar FullCalendar.
				  El cast es seguro — React asigna la instancia real de FullCalendar en ref.current.
				*/}
					<FullCalendar
						ref={cal.calendarRef as unknown as RefObject<FullCalendar>}
						plugins={[timeGridPlugin, interactionPlugin]}
						headerToolbar={false}
						initialView="timeGridWeek"
						locale="es"
						firstDay={1}
						slotMinTime="06:00:00"
						slotMaxTime="24:00:00"
						slotDuration="00:30:00"
						slotLabelInterval="01:00:00"
						slotLabelFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
						allDaySlot={false}
						editable={true}
						selectable={true}
						selectMirror={true}
						selectAllow={selectAllow}
						eventOverlap={false}
						nowIndicator={true}
						height="auto"
						contentHeight={660}
						events={cal.fetchEvents}
						datesSet={cal.onDatesSet}
						select={onSelect}
						eventClick={onEventClick}
						eventDrop={cal.handleDrop}
						eventResize={cal.handleResize}
					/>
				</div>
			</section>

			{/* Hint inferior */}
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
