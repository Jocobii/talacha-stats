/**
 * features/venue-calendar/delete-rental.ts
 * Elimina permanentemente una renta de cancha.
 */

import { db } from "@/db";
import { venueRentals } from "@/db/schema";
import { eq } from "drizzle-orm";

type Result = { ok: true; id: string } | { ok: false; error: string; status: number };

export async function deleteRental(id: string): Promise<Result> {
	const existing = await db.query.venueRentals.findFirst({
		where: eq(venueRentals.id, id),
		columns: { id: true },
	});
	if (!existing) return { ok: false, error: "Renta no encontrada", status: 404 };

	await db.delete(venueRentals).where(eq(venueRentals.id, id));

	return { ok: true, id };
}
