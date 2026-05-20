/**
 * features/scheduling/purchased/delete-purchased-slot.ts
 */

import { db } from "@/db";
import { teamPurchasedTimeslots } from "@/db/schema";
import { eq } from "drizzle-orm";

export type DeletePurchasedSlotResult = { ok: true } | { ok: false; error: string; status: 404 };

export async function deletePurchasedSlot(id: string): Promise<DeletePurchasedSlotResult> {
	const existing = await db.query.teamPurchasedTimeslots.findFirst({
		where: eq(teamPurchasedTimeslots.id, id),
		columns: { id: true },
	});
	if (!existing) return { ok: false, error: "Horario comprado no encontrado", status: 404 };

	await db.delete(teamPurchasedTimeslots).where(eq(teamPurchasedTimeslots.id, id));
	return { ok: true };
}
