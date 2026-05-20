/**
 * features/scheduling/config/get-config.ts
 * Lee la configuración de sorteo de una liga.
 */

import { db } from "@/db";
import { leagueSchedulingConfig, teams } from "@/db/schema";
import { eq, count } from "drizzle-orm";
import type { LeagueSchedulingConfig } from "@/db/schema";

export type ConfigWithDefaults = LeagueSchedulingConfig & { teamCount: number };

export async function getSchedulingConfig(leagueId: string): Promise<ConfigWithDefaults | null> {
	const [config, teamCountRow] = await Promise.all([
		db.query.leagueSchedulingConfig.findFirst({
			where: eq(leagueSchedulingConfig.leagueId, leagueId),
		}),
		db.select({ total: count() }).from(teams).where(eq(teams.leagueId, leagueId)),
	]);

	const teamCount = teamCountRow[0]?.total ?? 0;
	if (!config) return null;

	return { ...config, teamCount };
}
