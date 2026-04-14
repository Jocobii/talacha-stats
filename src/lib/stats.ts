import { db, matchEvents, playerRegistrations, matches, playerSeasonStats } from "@/db";
import { eq, and, inArray, sql } from "drizzle-orm";
import type { PlayerStats, PlayerGlobalStats } from "@/types";

/**
 * Devuelve las estadísticas de un jugador desglosadas por liga.
 * Prioridad: player_season_stats (importados desde Excel) si existen,
 * luego calcula desde match_events como fallback.
 */
export async function getPlayerLeagueStats(playerId: string): Promise<PlayerStats[]> {
  // Primero buscar stats importadas directamente (Excel bulk)
  const bulkStats = await db.query.playerSeasonStats.findMany({
    where: eq(playerSeasonStats.playerId, playerId),
    with: { league: true, team: true, player: true },
  });

  if (bulkStats.length > 0) {
    return bulkStats.map((s) => ({
      playerId,
      fullName: s.player?.fullName ?? "",
      alias: s.player?.alias ?? null,
      leagueId: s.leagueId,
      leagueName: s.league.name,
      season: s.league.season,
      teamId: s.teamId ?? "",
      teamName: s.team?.name ?? "",
      matchesPlayed: s.matchesPlayed,
      goals: s.goals,
      assists: s.assists,
      yellowCards: s.yellowCards,
      redCards: s.redCards,
      ownGoals: 0,
      mvpCount: 0,
    }));
  }

  // Obtener todas las registrations del jugador
  const registrations = await db.query.playerRegistrations.findMany({
    where: eq(playerRegistrations.playerId, playerId),
    with: { league: true, team: true, player: true },
  });

  if (registrations.length === 0) return [];

  const results: PlayerStats[] = [];

  for (const reg of registrations) {
    // Partidos completados de esa liga
    const leagueMatches = await db.query.matches.findMany({
      where: and(
        eq(matches.leagueId, reg.leagueId),
        eq(matches.status, "completed")
      ),
      columns: { id: true },
    });

    const matchIds = leagueMatches.map((m) => m.id);

    if (matchIds.length === 0) {
      results.push(buildEmptyStats(playerId, reg));
      continue;
    }

    // Contar eventos del jugador en esos partidos
    const eventCounts = await db
      .select({
        eventType: matchEvents.eventType,
        count: sql<number>`count(*)::int`,
      })
      .from(matchEvents)
      .where(
        and(
          eq(matchEvents.playerId, playerId),
          inArray(matchEvents.matchId, matchIds)
        )
      )
      .groupBy(matchEvents.eventType);

    // Partidos en los que el jugador tuvo al menos 1 evento
    const matchesPlayed = await db
      .selectDistinct({ matchId: matchEvents.matchId })
      .from(matchEvents)
      .where(
        and(
          eq(matchEvents.playerId, playerId),
          inArray(matchEvents.matchId, matchIds)
        )
      );

    const counts = Object.fromEntries(eventCounts.map((e) => [e.eventType, e.count]));

    results.push({
      playerId,
      fullName: reg.player?.fullName ?? "",
      alias: reg.player?.alias ?? null,
      leagueId: reg.leagueId,
      leagueName: reg.league.name,
      season: reg.league.season,
      teamId: reg.teamId,
      teamName: reg.team.name,
      matchesPlayed: matchesPlayed.length,
      goals: counts["goal"] ?? 0,
      assists: counts["assist"] ?? 0,
      yellowCards: counts["yellow_card"] ?? 0,
      redCards: counts["red_card"] ?? 0,
      ownGoals: counts["own_goal"] ?? 0,
      mvpCount: counts["mvp"] ?? 0,
    });
  }

  return results;
}

/**
 * Devuelve las estadísticas globales del jugador (suma de todas las ligas).
 */
export async function getPlayerGlobalStats(playerId: string): Promise<PlayerGlobalStats> {
  const byLeague = await getPlayerLeagueStats(playerId);

  const player = await db.query.players.findFirst({
    where: (p, { eq }) => eq(p.id, playerId),
    columns: { fullName: true, alias: true },
  });

  return {
    playerId,
    fullName: player?.fullName ?? "",
    alias: player?.alias ?? null,
    totalMatches: sum(byLeague, "matchesPlayed"),
    totalGoals: sum(byLeague, "goals"),
    totalAssists: sum(byLeague, "assists"),
    totalYellowCards: sum(byLeague, "yellowCards"),
    totalRedCards: sum(byLeague, "redCards"),
    totalOwnGoals: sum(byLeague, "ownGoals"),
    totalMvp: sum(byLeague, "mvpCount"),
    leaguesCount: byLeague.length,
  };
}

/**
 * Top goleadores de una liga, ordenados por goles desc.
 */
export async function getLeagueTopScorers(leagueId: string, limit = 10) {
  const leagueMatches = await db.query.matches.findMany({
    where: and(eq(matches.leagueId, leagueId), eq(matches.status, "completed")),
    columns: { id: true },
  });

  if (leagueMatches.length === 0) return [];

  const matchIds = leagueMatches.map((m) => m.id);

  const rows = await db
    .select({
      playerId: matchEvents.playerId,
      goals: sql<number>`count(*)::int`,
    })
    .from(matchEvents)
    .where(
      and(
        eq(matchEvents.eventType, "goal"),
        inArray(matchEvents.matchId, matchIds)
      )
    )
    .groupBy(matchEvents.playerId)
    .orderBy(sql`count(*) desc`)
    .limit(limit);

  // Enriquecer con datos del jugador
  const enriched = await Promise.all(
    rows.map(async (r) => {
      const player = await db.query.players.findFirst({
        where: (p, { eq }) => eq(p.id, r.playerId),
        columns: { fullName: true, alias: true },
      });
      const reg = await db.query.playerRegistrations.findFirst({
        where: and(
          eq(playerRegistrations.playerId, r.playerId),
          eq(playerRegistrations.leagueId, leagueId)
        ),
        with: { team: true },
      });
      return {
        playerId: r.playerId,
        fullName: player?.fullName ?? "",
        alias: player?.alias ?? null,
        teamName: reg?.team?.name ?? "",
        goals: r.goals,
      };
    })
  );

  return enriched;
}

/**
 * Top asistidores de una liga, ordenados por asistencias desc.
 */
export async function getLeagueTopAssists(leagueId: string, limit = 10) {
  const leagueMatches = await db.query.matches.findMany({
    where: and(eq(matches.leagueId, leagueId), eq(matches.status, "completed")),
    columns: { id: true },
  });

  if (leagueMatches.length === 0) return [];

  const matchIds = leagueMatches.map((m) => m.id);

  const rows = await db
    .select({
      playerId: matchEvents.playerId,
      assists: sql<number>`count(*)::int`,
    })
    .from(matchEvents)
    .where(
      and(
        eq(matchEvents.eventType, "assist"),
        inArray(matchEvents.matchId, matchIds)
      )
    )
    .groupBy(matchEvents.playerId)
    .orderBy(sql`count(*) desc`)
    .limit(limit);

  const enriched = await Promise.all(
    rows.map(async (r) => {
      const player = await db.query.players.findFirst({
        where: (p, { eq }) => eq(p.id, r.playerId),
        columns: { fullName: true, alias: true },
      });
      const reg = await db.query.playerRegistrations.findFirst({
        where: and(
          eq(playerRegistrations.playerId, r.playerId),
          eq(playerRegistrations.leagueId, leagueId)
        ),
        with: { team: true },
      });
      return {
        playerId: r.playerId,
        fullName: player?.fullName ?? "",
        alias: player?.alias ?? null,
        teamName: reg?.team?.name ?? "",
        assists: r.assists,
      };
    })
  );

  return enriched;
}

// ---------------------------------------------------------------------------
// Helpers internos
// ---------------------------------------------------------------------------
function sum(arr: PlayerStats[], key: keyof PlayerStats): number {
  return arr.reduce((acc, row) => acc + (Number(row[key]) || 0), 0);
}

function buildEmptyStats(playerId: string, reg: {
  league: { id: string; name: string; season: string };
  team: { id: string; name: string };
  leagueId: string;
  teamId: string;
  player: { fullName: string; alias: string | null } | null;
}): PlayerStats {
  return {
    playerId,
    fullName: reg.player?.fullName ?? "",
    alias: reg.player?.alias ?? null,
    leagueId: reg.leagueId,
    leagueName: reg.league.name,
    season: reg.league.season,
    teamId: reg.teamId,
    teamName: reg.team.name,
    matchesPlayed: 0,
    goals: 0,
    assists: 0,
    yellowCards: 0,
    redCards: 0,
    ownGoals: 0,
    mvpCount: 0,
  };
}
