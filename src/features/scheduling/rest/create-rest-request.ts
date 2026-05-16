/**
 * features/scheduling/rest/create-rest-request.ts
 * Registra que un equipo solicita descansar en una jornada.
 * Bloquea si la jornada ya está publicada.
 */

import { db } from "@/db";
import { teamRestRequests, matchdays, teams } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import type { RestRequestInput } from "@/types";
import type { TeamRestRequest } from "@/db/schema";

export type CreateRestRequestResult =
	| { ok: true; restRequest: TeamRestRequest }
	| { ok: false; error: string; status: 400 | 409 | 404 };

export async function createRestRequest(
	leagueId: string,
	input: RestRequestInput,
): Promise<CreateRestRequestResult> {
	const team = await db.query.teams.findFirst({
		where: and(eq(teams.id, input.teamId), eq(teams.leagueId, leagueId)),
		columns: { id: true },
	});
	if (!team) return { ok: false, error: "El equipo no pertenece a esta liga", status: 404 };

	const existingMatchday = await db.query.matchdays.findFirst({
		where: and(eq(matchdays.leagueId, leagueId), eq(matchdays.number, input.matchdayNumber)),
		columns: { id: true, status: true },
	});
	if (
		existingMatchday &&
		["published", "in_progress", "completed"].includes(existingMatchday.status)
	) {
		return {
			ok: false,
			error: "No se puede solicitar descanso en una jornada ya publicada",
			status: 409,
		};
	}

	const duplicate = await db.query.teamRestRequests.findFirst({
		where: and(
			eq(teamRestRequests.teamId, input.teamId),
			eq(teamRestRequests.leagueId, leagueId),
			eq(teamRestRequests.matchdayNumber, input.matchdayNumber),
		),
		columns: { id: true },
	});
	if (duplicate)
		return {
			ok: false,
			error: "El equipo ya tiene un descanso solicitado para esa jornada",
			status: 409,
		};

	const [restRequest] = await db
		.insert(teamRestRequests)
		.values({
			teamId: input.teamId,
			leagueId,
			matchdayNumber: input.matchdayNumber,
			reason: input.reason ?? null,
		})
		.returning();

	return { ok: true, restRequest: restRequest! };
}
