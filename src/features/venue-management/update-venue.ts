/**
 * features/venue-management/update-venue.ts
 * Actualiza nombre y/o metadatos de una cancha.
 * Si cambia el nombre, recalcula el canónico y verifica unicidad.
 */

import { db } from "@/db";
import { venues } from "@/db/schema";
import { eq, and, ne } from "drizzle-orm";
import { sanitizeToCanonical } from "@/shared/lib/normalize";
import type { UpdateVenueInput } from "@/types";
import type { Venue } from "@/db/schema";

export type UpdateVenueResult =
	| { ok: true; venue: Venue }
	| { ok: false; error: string; status: 404 | 409 | 400 };

export async function updateVenue(id: string, input: UpdateVenueInput): Promise<UpdateVenueResult> {
	const current = await db.query.venues.findFirst({
		where: eq(venues.id, id),
		columns: { id: true, organizationId: true, name: true },
	});
	if (!current) return { ok: false, error: "Cancha no encontrada", status: 404 };

	const patch: Partial<Venue> = {};

	if (input.name !== undefined) {
		const nameCanonical = sanitizeToCanonical(input.name);
		if (!nameCanonical) return { ok: false, error: "Nombre inválido", status: 400 };

		const duplicate = await db.query.venues.findFirst({
			where: and(
				eq(venues.organizationId, current.organizationId),
				eq(venues.nameCanonical, nameCanonical),
				ne(venues.id, id),
			),
			columns: { id: true, name: true },
		});
		if (duplicate) {
			return {
				ok: false,
				error: `Ya existe una cancha con ese nombre ("${duplicate.name}")`,
				status: 409,
			};
		}

		patch.name = input.name;
		patch.nameCanonical = nameCanonical;
	}

	if (input.city !== undefined) patch.city = input.city;
	if (input.address !== undefined) patch.address = input.address;
	if (input.capacity !== undefined) patch.capacity = input.capacity;
	if (input.color !== undefined) patch.color = input.color;
	if (input.notes !== undefined) patch.notes = input.notes;

	const [updated] = await db.update(venues).set(patch).where(eq(venues.id, id)).returning();
	return { ok: true, venue: updated! };
}
