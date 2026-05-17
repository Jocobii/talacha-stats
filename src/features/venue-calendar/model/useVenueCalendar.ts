"use client";

/**
 * features/venue-calendar/model/useVenueCalendar.ts
 * Custom hook — toda la lógica de estado del calendario de canchas.
 * Reemplaza FullCalendar por calendario custom con semana navegable.
 */

import { useState, useCallback, useEffect } from "react";
import type { VenueEvent, CreateRentalPayload, UpdateRentalPayload } from "../types";

// ── Helpers de fecha ──────────────────────────────────────────────────────────

function toWeekStart(d: Date): Date {
	const date = new Date(d);
	const day = date.getDay();
	const diff = day === 0 ? -6 : 1 - day; // Lunes como inicio
	date.setHours(0, 0, 0, 0);
	date.setDate(date.getDate() + diff);
	return date;
}

export function addDays(d: Date, n: number): Date {
	const c = new Date(d);
	c.setDate(c.getDate() + n);
	return c;
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

export type UseVenueCalendarReturn = {
	selectedVenueId: string;
	setSelectedVenueId: (id: string) => void;
	events: VenueEvent[];
	isLoading: boolean;
	weekStart: Date;
	setWeekStart: (d: Date) => void;
	view: "week" | "day";
	setView: (v: "week" | "day") => void;
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
	isSaving: boolean;
	error: string | null;
};

// ── Hook principal ────────────────────────────────────────────────────────────

export function useVenueCalendar(initialVenueId: string): UseVenueCalendarReturn {
	const [selectedVenueId, setSelectedVenueId] = useState(initialVenueId);
	const [weekStart, setWeekStart] = useState<Date>(() => toWeekStart(new Date()));
	const [view, setView] = useState<"week" | "day">("week");

	const [events, setEvents] = useState<VenueEvent[]>([]);
	const [isLoading, setIsLoading] = useState(false);
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

	const loadEvents = useCallback(async (): Promise<void> => {
		setIsLoading(true);
		setError(null);
		try {
			const end = addDays(weekStart, 7);
			const res = await fetch(
				`/api/venues/${selectedVenueId}/events?start=${weekStart.toISOString()}&end=${end.toISOString()}`,
			);
			const json = await res.json();
			if (!json.ok) throw new Error(json.error ?? "Error al cargar eventos");
			setEvents(json.data as VenueEvent[]);
		} catch (e) {
			setError(e instanceof Error ? e.message : "Error inesperado");
		} finally {
			setIsLoading(false);
		}
	}, [selectedVenueId, weekStart]);

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect
		void loadEvents();
	}, [loadEvents]);

	async function handleCreate(payload: CreateRentalPayload): Promise<void> {
		setIsSaving(true);
		setError(null);
		try {
			const res = await fetch(`/api/venues/${selectedVenueId}/rentals`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});
			const json = await res.json();
			if (!json.ok) throw new Error(json.error ?? "Error al crear renta");
			setModal((m) => ({ ...m, isOpen: false }));
			void loadEvents();
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
			const json = await res.json();
			if (!json.ok) throw new Error(json.error ?? "Error al actualizar renta");
			setModal((m) => ({ ...m, isOpen: false }));
			setPopover((p) => ({ ...p, isOpen: false }));
			void loadEvents();
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
			const json = await res.json();
			if (!json.ok) throw new Error(json.error ?? "Error al eliminar renta");
			setPopover((p) => ({ ...p, isOpen: false }));
			void loadEvents();
		} catch (e) {
			setError(e instanceof Error ? e.message : "Error inesperado");
		} finally {
			setIsSaving(false);
		}
	}

	return {
		selectedVenueId,
		setSelectedVenueId,
		events,
		isLoading,
		weekStart,
		setWeekStart,
		view,
		setView,
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
		isSaving,
		error,
	};
}
