/**
 * features/venue-management/assign-venue.ts
 * Asigna o desasigna una cancha a una liga.
 */

import { db } from "@/db";
import { leagueVenues, matches, venues, leagues } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import type { LeagueVenue } from "@/db/schema";

export type AssignVenueResult =
	| { ok: true; leagueVenue: LeagueVenue }
	| { ok: false; error: string; status: 404 | 409 | 400 };

export type UnassignVenueResult = { ok: true } | { ok: false; error: string; status: 404 | 409 };

export async function assignVenueToLeague(
	leagueId: string,
	venueId: string,
	priority = 1,
): Promise<AssignVenueResult> {
	const [league, venue] = await Promise.all([
		db.query.leagues.findFirst({
			where: eq(leagues.id, leagueId),
			columns: { id: true, organizationId: true },
		}),
		db.query.venues.findFirst({
			where: eq(venues.id, venueId),
			columns: { id: true, organizationId: true },
		}),
	]);
	if (!league) return { ok: false, error: "Liga no encontrada", status: 404 };
	if (!venue) return { ok: false, error: "Cancha no encontrada", status: 404 };
	if (league.organizationId !== venue.organizationId) {
		return {
			ok: false,
			error: "La cancha no pertenece a la misma organización que la liga",
			status: 400,
		};
	}

	const [leagueVenue] = await db
		.insert(leagueVenues)
		.values({ leagueId, venueId, priority })
		.onConflictDoUpdate({
			target: [leagueVenues.leagueId, leagueVenues.venueId],
			set: { priority },
		})
		.returning();

	return { ok: true, leagueVenue: leagueVenue! };
}

export async function unassignVenueFromLeague(
	leagueId: string,
	venueId: string,
): Promise<UnassignVenueResult> {
	const assignment = await db.query.leagueVenues.findFirst({
		where: and(eq(leagueVenues.leagueId, leagueId), eq(leagueVenues.venueId, venueId)),
		columns: { leagueId: true },
	});
	if (!assignment)
		return { ok: false, error: "La cancha no está asignada a esta liga", status: 404 };

	const activeMatch = await db.query.matches.findFirst({
		where: and(
			eq(matches.venueId, venueId),
			eq(matches.leagueId, leagueId),
			eq(matches.status, "scheduled"),
		),
		columns: { id: true },
	});
	if (activeMatch) {
		return {
			ok: false,
			error: "No se puede desasignar: la cancha tiene partidos programados en esta liga",
			status: 409,
		};
	}

	await db
		.delete(leagueVenues)
		.where(and(eq(leagueVenues.leagueId, leagueId), eq(leagueVenues.venueId, venueId)));
	return { ok: true };
}
