/**
 * features/venue-calendar/update-rental.ts
 * Actualiza parcialmente una renta existente.
 */

import { db } from "@/db";
import { venueRentals } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { VenueEvent, UpdateRentalPayload } from "./types";

type Result = { ok: true; rental: VenueEvent } | { ok: false; error: string; status: number };

export async function updateRental(id: string, payload: UpdateRentalPayload): Promise<Result> {
	const existing = await db.query.venueRentals.findFirst({
		where: eq(venueRentals.id, id),
	});
	if (!existing) return { ok: false, error: "Renta no encontrada", status: 404 };

	const start = payload.startAt ? new Date(payload.startAt) : existing.startAt;
	const end = payload.endAt ? new Date(payload.endAt) : existing.endAt;

	if (end <= start) {
		return { ok: false, error: "La hora de fin debe ser posterior a la de inicio", status: 400 };
	}

	const values: Partial<typeof venueRentals.$inferInsert> = {
		updatedAt: new Date(),
	};
	if (payload.title !== undefined) values.title = payload.title;
	if (payload.startAt !== undefined) values.startAt = start;
	if (payload.endAt !== undefined) values.endAt = end;
	if (payload.status !== undefined) values.status = payload.status;
	if (payload.price !== undefined)
		values.price = payload.price != null ? String(payload.price) : null;
	if (payload.notes !== undefined) values.notes = payload.notes ?? null;

	const [updated] = await db
		.update(venueRentals)
		.set(values)
		.where(eq(venueRentals.id, id))
		.returning();

	if (!updated) return { ok: false, error: "Error al actualizar la renta", status: 500 };

	return {
		ok: true,
		rental: {
			id: updated.id,
			type: `rental_${updated.status}` as VenueEvent["type"],
			title: updated.title,
			startAt: updated.startAt.toISOString(),
			endAt: updated.endAt.toISOString(),
			venueId: updated.venueId,
			rentalId: updated.id,
			clientName: updated.title,
			price: updated.price != null ? Number(updated.price) : null,
			notes: updated.notes ?? null,
			status: updated.status,
		},
	};
}
