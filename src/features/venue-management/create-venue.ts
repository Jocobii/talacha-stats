/**
 * features/venue-management/create-venue.ts
 * Crea una cancha en la organización.
 * Aplica sanitización canónica y verifica duplicados antes del INSERT (Regla 1 CLAUDE.md).
 */

import { db } from "@/db";
import { venues } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { sanitizeToCanonical } from "@/shared/lib/normalize";
import type { CreateVenueInput } from "@/types";
import type { Venue } from "@/db/schema";

export type CreateVenueResult =
	| { ok: true; venue: Venue }
	| { ok: false; error: string; status: 409 | 400 };

export async function createVenue(input: CreateVenueInput): Promise<CreateVenueResult> {
	const nameCanonical = sanitizeToCanonical(input.name);
	if (!nameCanonical)
		return { ok: false, error: "Nombre inválido después de sanitización", status: 400 };

	const existing = await db.query.venues.findFirst({
		where: and(
			eq(venues.organizationId, input.organizationId),
			eq(venues.nameCanonical, nameCanonical),
		),
		columns: { id: true, name: true },
	});
	if (existing) {
		return {
			ok: false,
			error: `Ya existe una cancha con ese nombre ("${existing.name}") en esta organización`,
			status: 409,
		};
	}

	const [venue] = await db
		.insert(venues)
		.values({
			name: input.name,
			nameCanonical,
			organizationId: input.organizationId,
			city: input.city ?? null,
			notes: input.notes ?? null,
		})
		.returning();

	return { ok: true, venue: venue! };
}
