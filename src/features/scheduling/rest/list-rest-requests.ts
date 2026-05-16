/**
 * features/scheduling/rest/list-rest-requests.ts
 */

import { db } from "@/db";
import { teamRestRequests } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { TeamRestRequest } from "@/db/schema";

export async function listRestRequests(leagueId: string): Promise<TeamRestRequest[]> {
	return db.query.teamRestRequests.findMany({
		where: eq(teamRestRequests.leagueId, leagueId),
		orderBy: (r, { asc }) => [asc(r.matchdayNumber), asc(r.requestedAt)],
	});
}
