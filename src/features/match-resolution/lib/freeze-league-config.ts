/**
 * features/match-resolution/lib/freeze-league-config.ts
 *
 * Congela `league_config` cuando se resuelve la primera cédula "real" de la
 * liga (jugado o W.O. — no cuenta suspendido/pospuesto/programado). A partir
 * de ahí el reglamento del torneo deja de ser editable — §4.4 de
 * docs/MODULOS-GESTION-LIGA.md ("la config se bloquea al arrancar el
 * torneo"). Debe llamarse dentro de la misma transacción que resuelve el
 * partido, para que el conteo sea consistente.
 */

import { and, count, eq, inArray, ne } from "drizzle-orm";
import { db } from "@/db";
import { matches } from "@/db/schema";
import { lockLeagueConfigTx } from "@/entities/league-config/queries";

type DbTx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Statuses que cuentan como "el torneo ya arrancó" (mismo criterio que
 * standings.ts, sin "completed" — V1 legacy no pasa por esta feature).
 * Exportado: también lo usa el motor de disciplina (B5) para decidir cuándo
 * una cédula "sirve" una fecha de suspensión.
 */
export const COUNTED_RESOLUTION_STATUSES = ["played", "walkover_home", "walkover_away"] as const;

export async function maybeFreezeLeagueConfig(
	tx: DbTx,
	leagueId: string,
	matchId: string,
	status: string,
): Promise<void> {
	if (!(COUNTED_RESOLUTION_STATUSES as readonly string[]).includes(status)) return;

	const [row] = await tx
		.select({ total: count() })
		.from(matches)
		.where(
			and(
				eq(matches.leagueId, leagueId),
				inArray(matches.status, [...COUNTED_RESOLUTION_STATUSES]),
				ne(matches.id, matchId),
			),
		);

	// Si no hay OTRO partido ya contado, este es el primero → congelar.
	if ((row?.total ?? 0) === 0) {
		await lockLeagueConfigTx(tx, leagueId);
	}
}
