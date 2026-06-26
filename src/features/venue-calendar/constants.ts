/**
 * features/venue-calendar/constants.ts
 * Colores y labels de eventos para FullCalendar.
 */

import type { CalendarEventType } from "./types";

export type EventColors = {
	background: string;
	border: string;
	text: string;
};

export const EVENT_COLORS: Record<CalendarEventType, EventColors> = {
	tournament: { background: "#1e3a5f", border: "#2563eb", text: "#93c5fd" },
	rental_confirmed: { background: "#14532d", border: "#16a34a", text: "#86efac" },
	rental_tentative: { background: "#451a03", border: "#d97706", text: "#fcd34d" },
	rental_cancelled: { background: "#1c1c1c", border: "#4b5563", text: "#6b7280" },
};

export const RENTAL_STATUS_LABELS: Record<string, string> = {
	confirmed: "Confirmada",
	tentative: "Tentativa",
	cancelled: "Cancelada",
};

export const EVENT_TYPE_LABELS: Record<CalendarEventType, string> = {
	tournament: "Torneo",
	rental_confirmed: "Renta confirmada",
	rental_tentative: "Renta tentativa",
	rental_cancelled: "Renta cancelada",
};

// ── URLs de API (sin magic strings dispersos) ───────────────────────────────────

export const VENUE_EVENTS_URL = (venueId: string, range: { start: string; end: string }): string =>
	`/api/venues/${venueId}/events?start=${range.start}&end=${range.end}`;

export const VENUE_RENTALS_URL = (venueId: string): string => `/api/venues/${venueId}/rentals`;

export const RENTAL_URL = (rentalId: string): string => `/api/venue-rentals/${rentalId}`;
