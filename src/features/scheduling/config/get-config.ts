/**
 * features/scheduling/config/get-config.ts
 * Lee la configuración de sorteo de una liga.
 */

import { db } from "@/db";
import { leagueSchedulingConfig, teams } from "@/db/schema";
import { and, eq, count } from "drizzle-orm";
import type { LeagueSchedulingConfig } from "@/db/schema";

export type ConfigWithDefaults = LeagueSchedulingConfig & { teamCount: number };

export async function getSchedulingConfig(leagueId: string): Promise<ConfigWithDefaults | null> {
	const [config, teamCountRow] = await Promise.all([
		db.query.leagueSchedulingConfig.findFirst({
			where: eq(leagueSchedulingConfig.leagueId, leagueId),
		}),
		// Solo equipos 'active' cuentan para el sorteo — 'pending' (banca) y
		// 'disbanded' quedan fuera (NUEVA-TEMPORADA-V2.md §3.2).
		db
			.select({ total: count() })
			.from(teams)
			.where(and(eq(teams.leagueId, leagueId), eq(teams.status, "active"))),
	]);

	const teamCount = teamCountRow[0]?.total ?? 0;
	if (!config) return null;

	return { ...config, teamCount };
}
