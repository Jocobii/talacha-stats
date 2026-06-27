"use client";

/**
 * features/venue-calendar/model/useVenueCalendar.ts
 * Custom hook — toda la lógica del calendario de canchas.
 * Motor: FullCalendar (fetchEvents + calendarRef para navegación).
 */

import { useState, useCallback, useRef, useEffect, type RefObject } from "react";
import type { EventInput } from "@fullcalendar/core";
import type { VenueEvent, CreateRentalPayload, UpdateRentalPayload } from "../types";
import { mapVenueEventToCalendarEvent } from "../lib/map-calendar-event";
import { fetchVenueEvents } from "../lib/venue-calendar-api";
import { useRentalMutations } from "./useRentalMutations";

// ── Tipos mínimos de FullCalendar (evita importar de @fullcalendar/react e interaction) ──

/** API de FullCalendar que usamos para navegación y refetch */
type CalendarApi = {
	prev: () => void;
	next: () => void;
	today: () => void;
	changeView: (view: string) => void;
	refetchEvents: () => void;
	view: { title: string; type: string };
};
/** Handle de la instancia FullCalendar expuesta por el ref */
type CalendarHandle = { getApi: () => CalendarApi };

/** Subset de DatesSetArg necesario en el hook */
type DatesSetInfo = { view: { title: string; type: string } };

/** Subset de EventDropArg necesario en el hook */
type DropArg = {
	event: { startStr: string; endStr: string | null; extendedProps: Record<string, unknown> };
	revert: () => void;
};

/** Subset de EventResizeDoneArg necesario en el hook */
type ResizeArg = {
	event: { startStr: string; endStr: string; extendedProps: Record<string, unknown> };
	revert: () => void;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

// ── Tipos ─────────────────────────────────────────────────────────────────────

type ModalState = {
	isOpen: boolean;
	defaultStart: string | null;
	defaultEnd: string | null;
	editingEvent: VenueEvent | null;
};

type PopoverState = {
	isOpen: boolean;
	event: VenueEvent | null;
	anchorEl: HTMLElement | null;
};

type FetchInfo = { startStr: string; endStr: string };
type SuccessCb = (events: EventInput[]) => void;
type FailureCb = (error: Error) => void;

export type UseVenueCalendarReturn = {
	calendarRef: RefObject<CalendarHandle | null>;
	fetchEvents: (info: FetchInfo, successCb: SuccessCb, failureCb: FailureCb) => void;
	displayEvents: VenueEvent[];
	selectedVenueId: string;
	setSelectedVenueId: (id: string) => void;
	view: "week" | "day";
	viewTitle: string;
	onDatesSet: (arg: DatesSetInfo) => void;
	modal: ModalState & {
		openCreate: (start: string, end: string) => void;
		openEdit: (event: VenueEvent) => void;
		close: () => void;
	};
	popover: PopoverState & {
		open: (event: VenueEvent, el: HTMLElement) => void;
		close: () => void;
	};
	handleCreate: (payload: CreateRentalPayload) => Promise<void>;
	handleUpdate: (id: string, payload: UpdateRentalPayload) => Promise<void>;
	handleDelete: (id: string) => Promise<void>;
	handleDrop: (arg: DropArg) => Promise<void>;
	handleResize: (arg: ResizeArg) => Promise<void>;
	isSaving: boolean;
	error: string | null;
};

// ── Hook principal ────────────────────────────────────────────────────────────

export function useVenueCalendar(initialVenueId: string): UseVenueCalendarReturn {
	const calendarRef = useRef<CalendarHandle | null>(null);
	const [selectedVenueId, setSelectedVenueIdState] = useState(initialVenueId);
	const [view, setView] = useState<"week" | "day">("week");
	const [viewTitle, setViewTitle] = useState("");
	const [displayEvents, setDisplayEvents] = useState<VenueEvent[]>([]);

	const [modal, setModal] = useState<ModalState>({
		isOpen: false,
		defaultStart: null,
		defaultEnd: null,
		editingEvent: null,
	});

	const [popover, setPopover] = useState<PopoverState>({
		isOpen: false,
		event: null,
		anchorEl: null,
	});

	// FullCalendar events source — llamado por FC al cambiar el rango de fechas
	const fetchEvents = useCallback(
		(info: FetchInfo, successCb: SuccessCb, failureCb: FailureCb): void => {
			fetchVenueEvents(selectedVenueId, { start: info.startStr, end: info.endStr })
				.then((events) => {
					setDisplayEvents(events);
					successCb(events.map(mapVenueEventToCalendarEvent));
				})
				.catch((fetchError: unknown) => {
					failureCb(fetchError instanceof Error ? fetchError : new Error("Error inesperado"));
				});
		},
		[selectedVenueId],
	);

	// Refetch automático al cambiar de cancha
	useEffect(() => {
		calendarRef.current?.getApi().refetchEvents();
	}, [selectedVenueId]);

	function setSelectedVenueId(id: string): void {
		setSelectedVenueIdState(id);
	}

	// El refetch de FullCalendar es la "invalidación" del calendario: los eventos
	// no son una query RQ (los maneja el motor de FC), así que las mutaciones lo
	// disparan al tener éxito.
	const refetch = useCallback((): void => {
		calendarRef.current?.getApi().refetchEvents();
	}, []);

	const rentals = useRentalMutations(selectedVenueId, { onSuccess: refetch });

	function onDatesSet(arg: DatesSetInfo): void {
		setViewTitle(arg.view.title);
		setView(arg.view.type === "timeGridDay" ? "day" : "week");
	}

	// Drag & drop — solo rentas editables; torneos revertan
	async function handleDrop(arg: DropArg): Promise<void> {
		const venueEvent = arg.event.extendedProps.venueEvent as VenueEvent;
		if (!venueEvent.rentalId) {
			arg.revert();
			return;
		}
		rentals.updateRental(
			{
				id: venueEvent.rentalId,
				payload: { startAt: arg.event.startStr, endAt: arg.event.endStr ?? undefined },
			},
			{ onError: () => arg.revert() },
		);
	}

	// Resize — solo rentas
	async function handleResize(arg: ResizeArg): Promise<void> {
		const venueEvent = arg.event.extendedProps.venueEvent as VenueEvent;
		if (!venueEvent.rentalId) {
			arg.revert();
			return;
		}
		rentals.updateRental(
			{
				id: venueEvent.rentalId,
				payload: { startAt: arg.event.startStr, endAt: arg.event.endStr },
			},
			{ onError: () => arg.revert() },
		);
	}

	function handleCreate(payload: CreateRentalPayload): Promise<void> {
		rentals.createRental(payload, {
			onSuccess: () => setModal((m) => ({ ...m, isOpen: false })),
		});
		return Promise.resolve();
	}

	function handleUpdate(id: string, payload: UpdateRentalPayload): Promise<void> {
		rentals.updateRental(
			{ id, payload },
			{
				onSuccess: () => {
					setModal((m) => ({ ...m, isOpen: false }));
					setPopover((p) => ({ ...p, isOpen: false }));
				},
			},
		);
		return Promise.resolve();
	}

	function handleDelete(id: string): Promise<void> {
		rentals.deleteRental(id, {
			onSuccess: () => setPopover((p) => ({ ...p, isOpen: false })),
		});
		return Promise.resolve();
	}

	return {
		calendarRef,
		fetchEvents,
		displayEvents,
		selectedVenueId,
		setSelectedVenueId,
		view,
		viewTitle,
		onDatesSet,
		modal: {
			...modal,
			openCreate: (start, end) =>
				setModal({ isOpen: true, defaultStart: start, defaultEnd: end, editingEvent: null }),
			openEdit: (event) =>
				setModal({ isOpen: true, defaultStart: null, defaultEnd: null, editingEvent: event }),
			close: () => setModal((m) => ({ ...m, isOpen: false })),
		},
		popover: {
			...popover,
			open: (event, el) => setPopover({ isOpen: true, event, anchorEl: el }),
			close: () => setPopover((p) => ({ ...p, isOpen: false })),
		},
		handleCreate,
		handleUpdate,
		handleDelete,
		handleDrop,
		handleResize,
		isSaving: rentals.isSaving,
		error: rentals.error,
	};
}
