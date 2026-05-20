/**
 * features/venue-calendar/create-rental.ts
 * Crea una renta directa para una cancha.
 * Valida que no haya conflicto con rentas existentes en el mismo rango.
 */

import { db } from "@/db";
import { venueRentals } from "@/db/schema";
import { checkVenueOverlap } from "./check-venue-overlap";
import type { VenueEvent, CreateRentalPayload } from "./types";

type Params = {
	venueId: string;
	payload: CreateRentalPayload;
};

type Result = { ok: true; rental: VenueEvent } | { ok: false; error: string; status: number };

export async function createRental({ venueId, payload }: Params): Promise<Result> {
	const start = new Date(payload.startAt);
	const end = new Date(payload.endAt);

	if (end <= start) {
		return { ok: false, error: "La hora de fin debe ser posterior a la de inicio", status: 400 };
	}

	const overlap = await checkVenueOverlap({ venueId, start, end });
	if (overlap.hasConflict) {
		return {
			ok: false,
			error: `Horario ocupado por ${overlap.label}`,
			status: 409,
		};
	}

	const [inserted] = await db
		.insert(venueRentals)
		.values({
			venueId,
			title: payload.title,
			startAt: start,
			endAt: end,
			status: payload.status,
			price: payload.price != null ? String(payload.price) : null,
			notes: payload.notes ?? null,
		})
		.returning();

	if (!inserted) return { ok: false, error: "Error al crear la renta", status: 500 };

	return {
		ok: true,
		rental: toVenueEvent(inserted),
	};
}

function toVenueEvent(r: typeof venueRentals.$inferSelect): VenueEvent {
	return {
		id: r.id,
		type: `rental_${r.status}` as VenueEvent["type"],
		title: r.title,
		startAt: r.startAt.toISOString(),
		endAt: r.endAt.toISOString(),
		venueId: r.venueId,
		rentalId: r.id,
		clientName: r.title,
		price: r.price != null ? Number(r.price) : null,
		notes: r.notes ?? null,
		status: r.status,
	};
}
