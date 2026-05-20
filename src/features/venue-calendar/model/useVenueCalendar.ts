"use client";

/**
 * features/venue-calendar/model/useVenueCalendar.ts
 * Custom hook — toda la lógica del calendario de canchas.
 * Motor: FullCalendar (fetchEvents + calendarRef para navegación).
 */

import { useState, useCallback, useRef, useEffect, type RefObject } from "react";
import type { EventInput } from "@fullcalendar/core";
import type { VenueEvent, CreateRentalPayload, UpdateRentalPayload } from "../types";
import { EVENT_COLORS } from "../constants";

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

function toCalendarEvent(e: VenueEvent): EventInput {
	const colors = EVENT_COLORS[e.type];
	return {
		id: e.id,
		title: e.clientName ?? e.leagueName ?? e.title,
		start: e.startAt,
		end: e.endAt,
		backgroundColor: colors.background,
		borderColor: colors.border,
		textColor: colors.text,
		extendedProps: { venueEvent: e },
	};
}

async function patchRental(id: string, payload: UpdateRentalPayload): Promise<boolean> {
	const res = await fetch(`/api/venue-rentals/${id}`, {
		method: "PATCH",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(payload),
	});
	const json = (await res.json()) as { ok: boolean };
	return Boolean(json.ok);
}

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
	const [isSaving, setIsSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

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
			fetch(`/api/venues/${selectedVenueId}/events?start=${info.startStr}&end=${info.endStr}`)
				.then((res) => res.json())
				.then((json: { ok: boolean; data: VenueEvent[]; error?: string }) => {
					if (!json.ok) throw new Error(json.error ?? "Error al cargar eventos");
					setDisplayEvents(json.data);
					successCb(json.data.map(toCalendarEvent));
				})
				.catch((e: unknown) => {
					failureCb(e instanceof Error ? e : new Error("Error inesperado"));
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
		const ok = await patchRental(venueEvent.rentalId, {
			startAt: arg.event.startStr,
			endAt: arg.event.endStr ?? undefined,
		}).catch(() => false);
		if (!ok) arg.revert();
	}

	// Resize — solo rentas
	async function handleResize(arg: ResizeArg): Promise<void> {
		const venueEvent = arg.event.extendedProps.venueEvent as VenueEvent;
		if (!venueEvent.rentalId) {
			arg.revert();
			return;
		}
		const ok = await patchRental(venueEvent.rentalId, {
			startAt: arg.event.startStr,
			endAt: arg.event.endStr,
		}).catch(() => false);
		if (!ok) arg.revert();
	}

	async function handleCreate(payload: CreateRentalPayload): Promise<void> {
		setIsSaving(true);
		setError(null);
		try {
			const res = await fetch(`/api/venues/${selectedVenueId}/rentals`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});
			const json = (await res.json()) as { ok: boolean; error?: string };
			if (!json.ok) throw new Error(json.error ?? "Error al crear renta");
			setModal((m) => ({ ...m, isOpen: false }));
			calendarRef.current?.getApi().refetchEvents();
		} catch (e) {
			setError(e instanceof Error ? e.message : "Error inesperado");
		} finally {
			setIsSaving(false);
		}
	}

	async function handleUpdate(id: string, payload: UpdateRentalPayload): Promise<void> {
		setIsSaving(true);
		setError(null);
		try {
			const res = await fetch(`/api/venue-rentals/${id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});
			const json = (await res.json()) as { ok: boolean; error?: string };
			if (!json.ok) throw new Error(json.error ?? "Error al actualizar renta");
			setModal((m) => ({ ...m, isOpen: false }));
			setPopover((p) => ({ ...p, isOpen: false }));
			calendarRef.current?.getApi().refetchEvents();
		} catch (e) {
			setError(e instanceof Error ? e.message : "Error inesperado");
		} finally {
			setIsSaving(false);
		}
	}

	async function handleDelete(id: string): Promise<void> {
		setIsSaving(true);
		setError(null);
		try {
			const res = await fetch(`/api/venue-rentals/${id}`, { method: "DELETE" });
			const json = (await res.json()) as { ok: boolean; error?: string };
			if (!json.ok) throw new Error(json.error ?? "Error al eliminar renta");
			setPopover((p) => ({ ...p, isOpen: false }));
			calendarRef.current?.getApi().refetchEvents();
		} catch (e) {
			setError(e instanceof Error ? e.message : "Error inesperado");
		} finally {
			setIsSaving(false);
		}
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
		isSaving,
		error,
	};
}
