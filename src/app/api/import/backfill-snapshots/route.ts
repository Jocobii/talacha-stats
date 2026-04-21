import { db, playerSeasonStats, playerSeasonStatsSnapshot } from "@/db";
import { isNull, not } from "drizzle-orm";
import { apiSuccess, apiError } from "@/types";

// POST /api/import/backfill-snapshots
// Copia player_season_stats → player_season_stats_snapshot para todas las filas
// que tienen jornada registrada y aún no tienen snapshot para esa jornada.
// Endpoint de uso único — idempotente (ON CONFLICT DO NOTHING).
export async function POST() {
  try {
    const rows = await db
      .select()
      .from(playerSeasonStats)
      .where(not(isNull(playerSeasonStats.jornada)));

    if (rows.length === 0) {
      return apiSuccess({ backfilled: 0, message: "No hay filas con jornada registrada." });
    }

    let backfilled = 0;
    for (const row of rows) {
      await db
        .insert(playerSeasonStatsSnapshot)
        .values({
          playerId:      row.playerId,
          leagueId:      row.leagueId,
          teamId:        row.teamId,
          jornada:       row.jornada!,
          goals:         row.goals,
          assists:       row.assists,
          yellowCards:   row.yellowCards,
          redCards:      row.redCards,
          matchesPlayed: row.matchesPlayed,
          importedAt:    row.updatedAt,
        })
        .onConflictDoNothing();
      backfilled++;
    }

    return apiSuccess({
      backfilled,
      message: `${backfilled} registros copiados al historial de snapshots.`,
    });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Error en backfill", 500);
  }
}
