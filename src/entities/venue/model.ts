/**
 * entities/venue/model.ts
 * Tipos de dominio para la entidad Venue.
 */

import type { Venue, VenueTimeWindow, LeagueVenue } from "@/db/schema";

export type { Venue, VenueTimeWindow, LeagueVenue };

/** Venue con sus ventanas horarias y prioridad en la liga */
export type VenueWithWindows = Venue & {
	windows: VenueTimeWindow[];
	priority: number;
};

/** Venue con toda la información de liga (pantalla de asignación por liga) */
export type VenueForLeague = {
	id: string;
	name: string;
	address: string | null;
	city: string | null;
	color: string;
	capacity: number;
	notes: string | null;
	priority: number;
	windows: VenueTimeWindow[];
};

/** Liga compacta para la ficha de cancha en el pool global */
export type VenueLeagueRef = {
	id: string;
	name: string;
	season: string;
};

/** Venue enriquecido con agregaciones para el pool global /admin/canchas */
export type VenueWithStats = Venue & {
	ligasCount: number;
	ligas: VenueLeagueRef[];
	totalWindows: number;
};

export type NewVenue = {
	name: string;
	nameCanonical: string;
	organizationId: string;
	city?: string;
	address?: string;
	capacity?: number;
	color?: string;
	notes?: string;
};
