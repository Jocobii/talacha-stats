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

/** Venue con toda la información de liga */
export type VenueForLeague = {
	id: string;
	name: string;
	city: string | null;
	notes: string | null;
	priority: number;
	windows: VenueTimeWindow[];
};

export type NewVenue = {
	name: string;
	nameCanonical: string;
	organizationId: string;
	city?: string;
	notes?: string;
};
