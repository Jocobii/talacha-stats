/**
 * features/scheduling/config/upsert-config.ts
 * Crea o actualiza la configuración de sorteo de una liga.
 * "double" round-robin no está soportado en MVP — se rechaza.
 */

import { db } from "@/db";
import { leagueSchedulingConfig, teams } from "@/db/schema";
import { eq, count } from "drizzle-orm";
import type { SchedulingConfigInput } from "@/types";
import type { LeagueSchedulingConfig } from "@/db/schema";

export type UpsertConfigResult =
	| { ok: true; config: LeagueSchedulingConfig }
	| { ok: false; error: string; status: 400 };

export async function upsertSchedulingConfig(
	leagueId: string,
	input: SchedulingConfigInput,
): Promise<UpsertConfigResult> {
	if (input.regularFormat === "double") {
		return {
			ok: false,
			error: "El formato doble round-robin no está disponible en esta versión",
			status: 400,
		};
	}

	const [teamCountRow] = await db
		.select({ total: count() })
		.from(teams)
		.where(eq(teams.leagueId, leagueId));

	const teamCount = teamCountRow?.total ?? 0;
	const maxMatchdays = teamCount <= 1 ? 1 : teamCount - 1;

	if (input.regularMatchdays > maxMatchdays && teamCount > 0) {
		return {
			ok: false,
			error: `Con ${teamCount} equipos el máximo de jornadas regulares es ${maxMatchdays}`,
			status: 400,
		};
	}

	const [config] = await db
		.insert(leagueSchedulingConfig)
		.values({ leagueId, ...input })
		.onConflictDoUpdate({
			target: leagueSchedulingConfig.leagueId,
			set: {
				regularMatchdays: input.regularMatchdays,
				regularFormat: input.regularFormat,
				matchDurationMinutes: input.matchDurationMinutes,
				bufferMinutes: input.bufferMinutes,
				allowDuplicateMatchups: input.allowDuplicateMatchups,
				updatedAt: new Date(),
			},
		})
		.returning();

	return { ok: true, config: config! };
}
