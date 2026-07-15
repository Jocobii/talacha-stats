/**
 * src/db/simulator/contributors/calendar.ts
 *
 * Contribuidor "calendar" — ver docs/ORGANIZATION-SIMULATOR.md §5 (Épica C1).
 * Escribe: matchdays.
 * Depende de: structure (leagues), venues.
 *
 * Incremental por diseño (§2.4 y §3 del doc): por cada liga, calcula la
 * próxima jornada desde el MAX(number) ya existente en DB y avanza
 * `ctx.jornadasToAdvance` (1–5) más, sin duplicar lo ya generado. Tope de
 * `JORNADAS_PER_TEMPORADA` (20) — si una liga ya llegó ahí, esta corrida no
 * le crea más jornadas (el cierre de temporada/liguilla es de una épica
 * posterior; por ahora simplemente no sobrepasa el límite).
 */

import { matchdays } from "@/db/schema";
import type { Matchday, League } from "@/db/schema";
import {
	JORNADAS_PER_TEMPORADA,
	setData,
	requireData,
	type Contributor,
	type SimContext,
} from "../context";
import { insertInBatches } from "../chunk";
import { getLeagues } from "./structure";

export const MATCHDAYS_KEY = "matchdays";

const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

async function fetchMaxJornadaByLeague(ctx: SimContext): Promise<Map<string, number>> {
	const rows = await ctx.db
		.select({ leagueId: matchdays.leagueId, number: matchdays.number })
		.from(matchdays);
	const maxByLeague = new Map<string, number>();
	for (const row of rows as { leagueId: string; number: number }[]) {
		const current = maxByLeague.get(row.leagueId) ?? 0;
		if (row.number > current) maxByLeague.set(row.leagueId, row.number);
	}
	return maxByLeague;
}

/** scheduledDate de la jornada N: `league.createdAt` + 7 días × (N − 1). */
export function scheduledDateForJornada(league: League, number: number): string {
	const base = new Date(league.createdAt).getTime();
	const date = new Date(base + MS_PER_WEEK * (number - 1));
	return date.toISOString().slice(0, 10);
}

function buildMatchdayDefs(league: League, fromNumber: number, count: number) {
	return Array.from({ length: count }, (_, i) => {
		const number = fromNumber + i;
		return {
			leagueId: league.id,
			number,
			phase: "regular" as const,
			scheduledDate: scheduledDateForJornada(league, number),
			status: "published" as const,
		};
	});
}

export const calendarContributor: Contributor = {
	name: "calendar",
	dependsOn: ["structure", "venues"],
	async contribute(ctx: SimContext): Promise<void> {
		const leagueRows = getLeagues(ctx);
		const maxByLeague = await fetchMaxJornadaByLeague(ctx);

		const defs: ReturnType<typeof buildMatchdayDefs> = [];
		for (const league of leagueRows) {
			const currentMax = maxByLeague.get(league.id) ?? 0;
			if (currentMax >= JORNADAS_PER_TEMPORADA) continue; // temporada completa — ver nota arriba

			const room = JORNADAS_PER_TEMPORADA - currentMax;
			const count = Math.min(ctx.jornadasToAdvance, room);
			defs.push(...buildMatchdayDefs(league, currentMax + 1, count));
		}

		const rows: Matchday[] = await insertInBatches(defs, (batch) =>
			ctx.db.insert(matchdays).values(batch).returning(),
		);
		setData(ctx, MATCHDAYS_KEY, rows);
	},
};

export function getMatchdays(ctx: SimContext): Matchday[] {
	return requireData<Matchday[]>(ctx, MATCHDAYS_KEY);
}

export function getMatchdaysByLeague(ctx: SimContext, leagueId: string): Matchday[] {
	return getMatchdays(ctx).filter((m) => m.leagueId === leagueId);
}
