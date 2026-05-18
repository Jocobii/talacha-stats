/**
 * entities/venue/queries.ts
 * Acceso de lectura a DB para la entidad Venue.
 * Escrituras viven en features/venue-management/.
 */

import { db } from "@/db";
import { venues, leagueVenues, venueTimeWindows } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import type { Venue } from "@/db/schema";
import type { VenueForLeague, VenueWithStats, VenueLeagueRef } from "./model";

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

/** Pool global con agregaciones: ligas que la usan y ventanas totales. */
export async function listVenuesWithStats(organizationId: string): Promise<VenueWithStats[]> {
	const rows = await db.query.venues.findMany({
		where: eq(venues.organizationId, organizationId),
		orderBy: (v, { asc }) => [asc(v.name)],
		with: {
			leagueVenues: {
				with: { league: { columns: { id: true, name: true, season: true } } },
			},
			timeWindows: { columns: { id: true } },
		},
	});

	return rows.map((row) => {
		const ligas: VenueLeagueRef[] = row.leagueVenues
			.map((lv) => lv.league)
			.filter((l): l is VenueLeagueRef => l !== null);
		return { ...row, ligasCount: ligas.length, ligas, totalWindows: row.timeWindows.length };
	});
}

export async function listVenuesByLeague(leagueId: string): Promise<VenueForLeague[]> {
	const rows = await db
		.select({
			id: venues.id,
			name: venues.name,
			address: venues.address,
			city: venues.city,
			color: venues.color,
			capacity: venues.capacity,
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

/** Canchas de la org que aún no están asignadas a una liga. */
export async function listUnassignedVenues(
	organizationId: string,
	leagueId: string,
): Promise<Venue[]> {
	const assigned = await db.query.leagueVenues.findMany({
		where: eq(leagueVenues.leagueId, leagueId),
		columns: { venueId: true },
	});
	const assignedIds = new Set(assigned.map((a) => a.venueId));

	const all = await db.query.venues.findMany({
		where: eq(venues.organizationId, organizationId),
		orderBy: (v, { asc }) => [asc(v.name)],
	});

	return all.filter((v) => !assignedIds.has(v.id));
}
