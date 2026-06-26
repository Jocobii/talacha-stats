/**
 * entities/narrator/queries.ts
 *
 * Acceso a DB para las métricas de uso del módulo de análisis del narrador.
 * El cálculo del análisis NO vive aquí (es puro, en la feature). Aquí solo
 * registramos y leemos cuántas veces se usa el módulo.
 */

import { db, narratorAnalysisEvents } from "@/db";
import { sql, gte } from "drizzle-orm";
import { sanitizeName } from "@/shared/lib/normalize";
import type { NarratorSource, NarratorUsageStats } from "./model";

export type RecordNarratorAnalysisInput = {
	source: NarratorSource;
	teamAName: string;
	teamBName: string;
	leagueName?: string | null;
	visitorId?: string | null;
};

/** Registra un análisis generado. Idempotencia no aplica: cada uso = una fila. */
export async function recordNarratorAnalysis(input: RecordNarratorAnalysisInput): Promise<void> {
	await db.insert(narratorAnalysisEvents).values({
		source: input.source,
		teamAName: sanitizeName(input.teamAName),
		teamBName: sanitizeName(input.teamBName),
		leagueName: input.leagueName ? sanitizeName(input.leagueName) : null,
		visitorId: input.visitorId ?? null,
	});
}

/** Resumen de uso para el dashboard de admin. */
export async function getNarratorUsageStats(): Promise<NarratorUsageStats> {
	const sevenDaysAgo = new Date();
	sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

	const [totals, recent, bySource, byLeague] = await Promise.all([
		db.select({ count: sql<number>`count(*)::int` }).from(narratorAnalysisEvents),
		db
			.select({ count: sql<number>`count(*)::int` })
			.from(narratorAnalysisEvents)
			.where(gte(narratorAnalysisEvents.createdAt, sevenDaysAgo)),
		db
			.select({
				source: narratorAnalysisEvents.source,
				count: sql<number>`count(*)::int`,
			})
			.from(narratorAnalysisEvents)
			.groupBy(narratorAnalysisEvents.source),
		// En qué ligas se usa más la herramienta (insumo de ventas).
		db
			.select({
				leagueName: narratorAnalysisEvents.leagueName,
				count: sql<number>`count(*)::int`,
			})
			.from(narratorAnalysisEvents)
			.where(sql`${narratorAnalysisEvents.leagueName} is not null`)
			.groupBy(narratorAnalysisEvents.leagueName)
			.orderBy(sql`count(*) desc`)
			.limit(50),
	]);

	return {
		total: totals[0]?.count ?? 0,
		last7Days: recent[0]?.count ?? 0,
		bySource: bySource.map((r) => ({ source: r.source as NarratorSource, count: r.count })),
		byLeague: byLeague.map((r) => ({ leagueName: r.leagueName ?? "—", count: r.count })),
	};
}
