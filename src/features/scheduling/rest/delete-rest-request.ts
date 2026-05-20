/**
 * features/scheduling/rest/delete-rest-request.ts
 * Cancela una solicitud de descanso.
 */

import { db } from "@/db";
import { teamRestRequests, matchdays } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export type DeleteRestRequestResult =
	| { ok: true }
	| { ok: false; error: string; status: 404 | 409 };

export async function deleteRestRequest(id: string): Promise<DeleteRestRequestResult> {
	const req = await db.query.teamRestRequests.findFirst({
		where: eq(teamRestRequests.id, id),
		columns: { id: true, leagueId: true, matchdayNumber: true },
	});
	if (!req) return { ok: false, error: "Solicitud de descanso no encontrada", status: 404 };

	const matchday = await db.query.matchdays.findFirst({
		where: and(eq(matchdays.leagueId, req.leagueId), eq(matchdays.number, req.matchdayNumber)),
		columns: { status: true },
	});
	if (matchday && ["published", "in_progress", "completed"].includes(matchday.status)) {
		return {
			ok: false,
			error: "No se puede cancelar el descanso de una jornada ya publicada",
			status: 409,
		};
	}

	await db.delete(teamRestRequests).where(eq(teamRestRequests.id, id));
	return { ok: true };
}
