/**
 * entities/venue/queries.ts
 * Acceso de lectura a DB para la entidad Venue.
 * Escrituras viven en features/venue-management/.
 */

import { db } from "@/db";
import { venues, leagueVenues, venueTimeWindows } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import type { Venue } from "@/db/schema";
import type { VenueForLeague } from "./model";

export async function getVenue(id: string): Promise<Venue | null> {
	const row = await db.query.venues.findFirst({ where: eq(venues.id, id) });
	return row ?? null;
}

export async function listVenuesByOrganization(organizationId: string): Promise<Venue[]> {
	return db.query.venues.findMany({
		where: eq(venues.organizationId, organizationId),
		orderBy: (v, { asc }) => [asc(v.name)],
	});
}

export async function listVenuesByLeague(leagueId: string): Promise<VenueForLeague[]> {
	const rows = await db
		.select({
			id: venues.id,
			name: venues.name,
			city: venues.city,
			notes: venues.notes,
			priority: leagueVenues.priority,
		})
		.from(leagueVenues)
		.innerJoin(venues, eq(leagueVenues.venueId, venues.id))
		.where(eq(leagueVenues.leagueId, leagueId))
		.orderBy(leagueVenues.priority);

	const venueIds = rows.map((r) => r.id);
	if (venueIds.length === 0) return [];

	const windows = await db.query.venueTimeWindows.findMany({
		where: and(eq(venueTimeWindows.leagueId, leagueId), eq(venueTimeWindows.isActive, true)),
	});

	return rows.map((row) => ({
		...row,
		windows: windows.filter((w) => w.venueId === row.id),
	}));
}
