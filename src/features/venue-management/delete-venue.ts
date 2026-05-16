/**
 * features/venue-management/delete-venue.ts
 * Elimina una cancha.
 * Bloquea si la cancha tiene matches futuros (scheduled) asignados.
 */

import { db } from "@/db";
import { venues, matches } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export type DeleteVenueResult = { ok: true } | { ok: false; error: string; status: 404 | 409 };

export async function deleteVenue(id: string): Promise<DeleteVenueResult> {
	const venue = await db.query.venues.findFirst({
		where: eq(venues.id, id),
		columns: { id: true },
	});
	if (!venue) return { ok: false, error: "Cancha no encontrada", status: 404 };

	const activeMatch = await db.query.matches.findFirst({
		where: and(eq(matches.venueId, id), eq(matches.status, "scheduled")),
		columns: { id: true },
	});
	if (activeMatch) {
		return {
			ok: false,
			error: "No se puede eliminar la cancha: tiene partidos programados asignados",
			status: 409,
		};
	}

	await db.delete(venues).where(eq(venues.id, id));
	return { ok: true };
}
