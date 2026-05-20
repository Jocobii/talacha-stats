/**
 * features/scheduling/purchased/list-purchased-slots.ts
 */

import { db } from "@/db";
import { teamPurchasedTimeslots } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { TeamPurchasedTimeslot } from "@/db/schema";

export async function listPurchasedSlots(leagueId: string): Promise<TeamPurchasedTimeslot[]> {
	return db.query.teamPurchasedTimeslots.findMany({
		where: eq(teamPurchasedTimeslots.leagueId, leagueId),
		orderBy: (s, { asc }) => [asc(s.startTime)],
	});
}
