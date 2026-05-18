/**
 * features/venue-management/delete-venue.ts
 * Elimina una cancha.
 * Bloquea si tiene partidos scheduled O está asignada a ligas:
 * devuelve 409 con los nombres de ligas afectadas para mostrar en la UI.
 */

import { db } from "@/db";
import { venues, matches, leagues, leagueVenues } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";

type AffectedLeague = { id: string; name: string };

export type DeleteVenueResult =
	| { ok: true }
	| { ok: false; error: string; status: 404 | 409; affectedLeagues?: AffectedLeague[] };

async function getAffectedLeagues(leagueIds: string[]): Promise<AffectedLeague[]> {
	if (leagueIds.length === 0) return [];
	return db
		.select({ id: leagues.id, name: leagues.name })
		.from(leagues)
		.where(inArray(leagues.id, leagueIds));
}

export async function deleteVenue(id: string): Promise<DeleteVenueResult> {
	const venue = await db.query.venues.findFirst({
		where: eq(venues.id, id),
		columns: { id: true },
	});
	if (!venue) return { ok: false, error: "Cancha no encontrada", status: 404 };

	// Partidos futuros asignados a esta cancha
	const activeMatches = await db.query.matches.findMany({
		where: and(eq(matches.venueId, id), eq(matches.status, "scheduled")),
		columns: { leagueId: true },
	});

	if (activeMatches.length > 0) {
		const uniqueIds = [
			...new Set(activeMatches.map((m) => m.leagueId).filter((l): l is string => l !== null)),
		];
		const affectedLeagues = await getAffectedLeagues(uniqueIds);
		return {
			ok: false,
			error: "No se puede eliminar: la cancha tiene partidos programados",
			status: 409,
			affectedLeagues,
		};
	}

	// Asignaciones a ligas (aunque sin partidos todavía)
	const assignments = await db.query.leagueVenues.findMany({
		where: eq(leagueVenues.venueId, id),
		columns: { leagueId: true },
	});

	if (assignments.length > 0) {
		const leagueIds = assignments.map((a) => a.leagueId);
		const affectedLeagues = await getAffectedLeagues(leagueIds);
		return {
			ok: false,
			error: "La cancha está asignada a una o más ligas",
			status: 409,
			affectedLeagues,
		};
	}

	await db.delete(venues).where(eq(venues.id, id));
	return { ok: true };
}
