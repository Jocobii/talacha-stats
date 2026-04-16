/**
 * POST /api/teams/merge
 * Fusiona uno o más equipos duplicados en un equipo canónico.
 *
 * Body: { keepId: string, mergeIds: string[] }
 *
 * Pasos (dentro de una transacción):
 *  1. player_registrations  — eliminar conflictos, reasignar team_id
 *  2. matches               — reasignar home_team_id / away_team_id
 *  3. match_events          — reasignar team_id
 *  4. player_season_stats   — eliminar conflictos, reasignar team_id
 *  5. team_standings_snapshot — eliminar conflictos, reasignar team_id
 *  6. Eliminar los equipos duplicados
 */

import { db } from "@/db";
import { sql } from "drizzle-orm";
import { apiSuccess, apiError } from "@/types";
import { z } from "zod";

const MergeSchema = z.object({
  keepId:   z.string().uuid(),
  mergeIds: z.array(z.string().uuid()).min(1).max(20),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = MergeSchema.safeParse(body);
  if (!parsed.success) return apiError("Datos inválidos: " + parsed.error.message, 400);

  const { keepId, mergeIds } = parsed.data;

  if (mergeIds.includes(keepId)) {
    return apiError("El equipo a conservar no puede estar en la lista de duplicados", 400);
  }

  // Construir el literal de array de UUIDs para SQL
  // Drizzle soporta sql`... ${sql.raw(...)} ...` para arrays pg
  const mergeArray = `ARRAY[${mergeIds.map(id => `'${id}'`).join(",")}]::uuid[]`;

  try {
    let deletedRegistrations = 0;
    let deletedStats = 0;
    let deletedSnapshots = 0;
    let updatedMatches = 0;
    let updatedEvents = 0;

    await db.transaction(async (tx) => {
      // ── 1. player_registrations ──────────────────────────────────────────
      // Eliminar registrations de los duplicados donde ya existe una del keepId
      // (mismo player_id + league_id → conflicto de UNIQUE)
      const delRegs = await tx.execute(sql.raw(`
        DELETE FROM player_registrations
        WHERE team_id = ANY(${mergeArray})
          AND player_id IN (
            SELECT player_id FROM player_registrations WHERE team_id = '${keepId}'
          )
        RETURNING id
      `));
      deletedRegistrations = (delRegs as { rowCount: number }).rowCount ?? 0;

      // Reasignar las restantes
      await tx.execute(sql.raw(`
        UPDATE player_registrations
        SET team_id = '${keepId}'
        WHERE team_id = ANY(${mergeArray})
      `));

      // ── 2. matches ───────────────────────────────────────────────────────
      const updHome = await tx.execute(sql.raw(`
        UPDATE matches SET home_team_id = '${keepId}'
        WHERE home_team_id = ANY(${mergeArray})
        RETURNING id
      `));
      const updAway = await tx.execute(sql.raw(`
        UPDATE matches SET away_team_id = '${keepId}'
        WHERE away_team_id = ANY(${mergeArray})
        RETURNING id
      `));
      updatedMatches = ((updHome as { rowCount: number }).rowCount ?? 0) +
                       ((updAway as { rowCount: number }).rowCount ?? 0);

      // ── 3. match_events ──────────────────────────────────────────────────
      const updEvt = await tx.execute(sql.raw(`
        UPDATE match_events SET team_id = '${keepId}'
        WHERE team_id = ANY(${mergeArray})
        RETURNING id
      `));
      updatedEvents = (updEvt as { rowCount: number }).rowCount ?? 0;

      // ── 4. player_season_stats ───────────────────────────────────────────
      // Eliminar stats del duplicado donde ya existe una del keepId (mismo player+league)
      const delStats = await tx.execute(sql.raw(`
        DELETE FROM player_season_stats
        WHERE team_id = ANY(${mergeArray})
          AND player_id IN (
            SELECT player_id FROM player_season_stats WHERE team_id = '${keepId}'
          )
        RETURNING id
      `));
      deletedStats = (delStats as { rowCount: number }).rowCount ?? 0;

      await tx.execute(sql.raw(`
        UPDATE player_season_stats SET team_id = '${keepId}'
        WHERE team_id = ANY(${mergeArray})
      `));

      // ── 5. team_standings_snapshot ───────────────────────────────────────
      // Eliminar snapshots del duplicado donde ya existe uno del keepId (mismo team+league+jornada)
      const delSnap = await tx.execute(sql.raw(`
        DELETE FROM team_standings_snapshot
        WHERE team_id = ANY(${mergeArray})
          AND (league_id, jornada) IN (
            SELECT league_id, jornada FROM team_standings_snapshot WHERE team_id = '${keepId}'
          )
        RETURNING id
      `));
      deletedSnapshots = (delSnap as { rowCount: number }).rowCount ?? 0;

      await tx.execute(sql.raw(`
        UPDATE team_standings_snapshot SET team_id = '${keepId}'
        WHERE team_id = ANY(${mergeArray})
      `));

      // ── 6. Eliminar equipos duplicados ───────────────────────────────────
      await tx.execute(sql.raw(`
        DELETE FROM teams WHERE id = ANY(${mergeArray})
      `));
    });

    return apiSuccess({
      merged: mergeIds.length,
      deletedRegistrations,
      deletedStats,
      deletedSnapshots,
      updatedMatches,
      updatedEvents,
    });
  } catch (e) {
    console.error("[merge]", e);
    return apiError("Error al fusionar equipos: " + (e instanceof Error ? e.message : "desconocido"), 500);
  }
}
