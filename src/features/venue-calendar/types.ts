/**
 * features/venue-calendar/types.ts
 * Tipos de dominio del módulo de calendario de canchas.
 */

/** Tipo de evento en el calendario */
export type CalendarEventType =
	| "tournament"
	| "rental_confirmed"
	| "rental_tentative"
	| "rental_cancelled";

/** Evento unificado devuelto por GET /api/venues/[id]/events */
export type VenueEvent = {
	id: string;
	type: CalendarEventType;
	title: string;
	startAt: string; // ISO 8601
	endAt: string; // ISO 8601
	venueId: string;
	// Solo si type === "tournament"
	leagueName?: string;
	matchInfo?: string; // "Equipo A vs Equipo B"
	// Solo si type starts with "rental"
	rentalId?: string;
	clientName?: string;
	price?: number | null;
	notes?: string | null;
	status?: "confirmed" | "tentative" | "cancelled";
};

/** Payload para crear una renta */
export type CreateRentalPayload = {
	title: string;
	startAt: string; // ISO 8601
	endAt: string; // ISO 8601
	status: "confirmed" | "tentative";
	price?: number | null;
	notes?: string | null;
};

/** Payload para actualizar una renta (todos los campos opcionales) */
export type UpdateRentalPayload = {
	title?: string;
	startAt?: string;
	endAt?: string;
	status?: "confirmed" | "tentative" | "cancelled";
	price?: number | null;
	notes?: string | null;
};

/** Resumen de cancha para el selector */
export type VenueSummary = {
	id: string;
	name: string;
	city: string | null;
};
