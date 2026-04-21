/**
 * entities/player/queries.ts
 * Acceso a DB para el perfil de jugador cross-liga.
 *
 * Fuentes de stats (prioridad):
 *  1. player_season_stats  → importadas desde Excel (más completas)
 *  2. match_events          → fallback si no hay import para esa liga
 */

import { eq, and, inArray, desc, sql } from "drizzle-orm";
import {
  db,
  players,
  playerRegistrations,
  playerSeasonStats,
  matchEvents,
  matches,
  leagues,
  teams,
} from "@/db";
import type {
  PlayerProfile,
  PlayerLeagueStats,
  PlayerGlobalProfile,
  PlayerEgoStats,
  PlayerPositions,
  PlayerTeamGoalShare,
  PlayerBadge,
} from "./model";
import { getPlayerPositions } from "./ranking";

// ── Función principal ─────────────────────────────────────────────────────────

export async function getPlayerProfile(
  playerId: string,
): Promise<PlayerProfile | null> {
  // 1. Datos básicos del jugador
  const player = await db.query.players.findFirst({
    where: eq(players.id, playerId),
  });
  if (!player) return null;

  // 2. Todas las ligas en las que está registrado (con liga y equipo)
  const registrations = await db.query.playerRegistrations.findMany({
    where: eq(playerRegistrations.playerId, playerId),
    with: { league: true, team: true },
  });

  if (registrations.length === 0) {
    return {
      id: player.id,
      fullName: player.fullName,
      alias: player.alias,
      phone: player.phone,
      photoUrl: player.photoUrl,
      global: emptyGlobal(),
      leagues: [],
    };
  }

  // 3. Todas las season_stats de este jugador (una sola query)
  const allSeasonStats = await db.query.playerSeasonStats.findMany({
    where: eq(playerSeasonStats.playerId, playerId),
  });
  const seasonStatsMap = new Map(allSeasonStats.map((s) => [s.leagueId, s]));

  // 4. Para ligas sin season_stats, obtener conteos desde match_events
  const leagueIdsWithoutStats = registrations
    .map((r) => r.leagueId)
    .filter((id) => !seasonStatsMap.has(id));

  const fallbackData = await fetchMatchEventsFallback(
    playerId,
    leagueIdsWithoutStats,
  );

  // 5. Construir stats por liga
  const leagueStats: PlayerLeagueStats[] = registrations.map((reg) => {
    const seasonStats = seasonStatsMap.get(reg.leagueId);

    if (seasonStats) {
      const gpm =
        seasonStats.matchesPlayed > 0
          ? round2(seasonStats.goals / seasonStats.matchesPlayed)
          : 0;
      return {
        leagueId: reg.leagueId,
        leagueName: reg.league.name,
        dayOfWeek: reg.league.dayOfWeek,
        season: reg.league.season,
        city: reg.league.city,
        teamId: reg.teamId,
        teamName: reg.team.name,
        goals: seasonStats.goals,
        assists: seasonStats.assists,
        contributions: seasonStats.goals + seasonStats.assists,
        yellowCards: seasonStats.yellowCards,
        redCards: seasonStats.redCards,
        mvpCount: 0, // player_season_stats no almacena MVPs
        matchesPlayed: seasonStats.matchesPlayed,
        goalsPerMatch: gpm,
        source: "season_stats",
      };
    }

    // Fallback desde match_events
    const fb = fallbackData.get(reg.leagueId) ?? emptyEventCounts();
    const gpm =
      fb.matchesPlayed > 0 ? round2(fb.goals / fb.matchesPlayed) : 0;
    return {
      leagueId: reg.leagueId,
      leagueName: reg.league.name,
      dayOfWeek: reg.league.dayOfWeek,
      season: reg.league.season,
      city: reg.league.city,
      teamId: reg.teamId,
      teamName: reg.team.name,
      goals: fb.goals,
      assists: fb.assists,
      contributions: fb.goals + fb.assists,
      yellowCards: fb.yellowCards,
      redCards: fb.redCards,
      mvpCount: fb.mvpCount,
      matchesPlayed: fb.matchesPlayed,
      goalsPerMatch: gpm,
      source: "match_events",
    };
  });

  // 6. Ordenar: más goles → más asistencias → nombre de liga
  leagueStats.sort((a, b) => {
    if (b.goals !== a.goals) return b.goals - a.goals;
    if (b.assists !== a.assists) return b.assists - a.assists;
    return a.leagueName.localeCompare(b.leagueName);
  });

  // 7. Stats globales
  const global = computeGlobal(leagueStats);

  return {
    id: player.id,
    fullName: player.fullName,
    alias: player.alias,
    phone: player.phone,
    photoUrl: player.photoUrl,
    global,
    leagues: leagueStats,
  };
}

// ── Fallback: conteos de match_events por liga ────────────────────────────────

type EventCounts = {
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  mvpCount: number;
  matchesPlayed: number;
};

async function fetchMatchEventsFallback(
  playerId: string,
  leagueIds: string[],
): Promise<Map<string, EventCounts>> {
  const result = new Map<string, EventCounts>();
  if (leagueIds.length === 0) return result;

  // Conteos por tipo de evento y liga — una sola query
  const eventRows = await db
    .select({
      leagueId: matches.leagueId,
      eventType: matchEvents.eventType,
      count: sql<number>`count(*)::int`,
    })
    .from(matchEvents)
    .innerJoin(matches, eq(matchEvents.matchId, matches.id))
    .where(
      and(
        eq(matchEvents.playerId, playerId),
        eq(matches.status, "completed"),
        inArray(matches.leagueId, leagueIds),
      ),
    )
    .groupBy(matches.leagueId, matchEvents.eventType);

  // Partidos jugados (distintos) por liga — una sola query
  const matchRows = await db
    .selectDistinct({
      leagueId: matches.leagueId,
      matchId: matchEvents.matchId,
    })
    .from(matchEvents)
    .innerJoin(matches, eq(matchEvents.matchId, matches.id))
    .where(
      and(
        eq(matchEvents.playerId, playerId),
        eq(matches.status, "completed"),
        inArray(matches.leagueId, leagueIds),
      ),
    );

  // Conteo de partidos por liga
  const matchCountByLeague = new Map<string, number>();
  for (const row of matchRows) {
    matchCountByLeague.set(
      row.leagueId,
      (matchCountByLeague.get(row.leagueId) ?? 0) + 1,
    );
  }

  // Agrupar eventos por liga
  for (const row of eventRows) {
    if (!result.has(row.leagueId)) {
      result.set(row.leagueId, emptyEventCounts());
    }
    const entry = result.get(row.leagueId)!;
    switch (row.eventType) {
      case "goal":        entry.goals       = row.count; break;
      case "assist":      entry.assists     = row.count; break;
      case "yellow_card": entry.yellowCards = row.count; break;
      case "red_card":    entry.redCards    = row.count; break;
      case "mvp":         entry.mvpCount    = row.count; break;
    }
  }

  // Inyectar partidos jugados
  for (const [leagueId, count] of matchCountByLeague) {
    if (!result.has(leagueId)) result.set(leagueId, emptyEventCounts());
    result.get(leagueId)!.matchesPlayed = count;
  }

  return result;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function computeGlobal(leagues: PlayerLeagueStats[]): PlayerGlobalProfile {
  const totalGoals     = leagues.reduce((s, l) => s + l.goals,       0);
  const totalAssists   = leagues.reduce((s, l) => s + l.assists,     0);
  const totalMatches   = leagues.reduce((s, l) => s + l.matchesPlayed, 0);
  const totalYellow    = leagues.reduce((s, l) => s + l.yellowCards, 0);
  const totalRed       = leagues.reduce((s, l) => s + l.redCards,    0);
  const totalMvp       = leagues.reduce((s, l) => s + l.mvpCount,    0);

  return {
    totalGoals,
    totalAssists,
    totalContributions: totalGoals + totalAssists,
    totalYellowCards: totalYellow,
    totalRedCards: totalRed,
    totalMvp,
    totalMatches,
    leaguesCount: leagues.length,
    goalsPerMatch: totalMatches > 0 ? round2(totalGoals / totalMatches) : 0,
  };
}

function emptyGlobal(): PlayerGlobalProfile {
  return {
    totalGoals: 0, totalAssists: 0, totalContributions: 0,
    totalYellowCards: 0, totalRedCards: 0, totalMvp: 0,
    totalMatches: 0, leaguesCount: 0, goalsPerMatch: 0,
  };
}

function emptyEventCounts(): EventCounts {
  return { goals: 0, assists: 0, yellowCards: 0, redCards: 0, mvpCount: 0, matchesPlayed: 0 };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// ── Player Ego Stats ──────────────────────────────────────────────────────────
// Todos los cálculos que alimentan el perfil público (ranking, racha, badges).
// Sin dependencia del resultado de getPlayerProfile — queries propias.

export async function getPlayerEgoStats(playerId: string): Promise<PlayerEgoStats> {
  // Rows de season_stats con info de liga y equipo
  const seasonRows = await db
    .select({
      leagueId:      playerSeasonStats.leagueId,
      leagueName:    leagues.name,
      teamId:        playerSeasonStats.teamId,
      teamName:      teams.name,
      goals:         playerSeasonStats.goals,
      matchesPlayed: playerSeasonStats.matchesPlayed,
      city:          leagues.city,
    })
    .from(playerSeasonStats)
    .innerJoin(leagues, eq(playerSeasonStats.leagueId, leagues.id))
    .leftJoin(teams,   eq(playerSeasonStats.teamId,   teams.id))
    .where(eq(playerSeasonStats.playerId, playerId));

  const [streak, hatTricks, mvpCount] = await Promise.all([
    fetchGoalStreak(playerId),
    fetchHatTricks(playerId),
    fetchMvpCount(playerId),
  ]);

  if (seasonRows.length === 0) {
    return emptyEgoStats();
  }

  // Liga con más goles para el scope de posiciones
  const bestRow = seasonRows.reduce((a, b) => (b.goals > a.goals ? b : a));

  const positions = await getPlayerPositions(playerId, {
    leagueId: bestRow.leagueId,
    city:     bestRow.city,
  });

  const cityTopPercent =
    positions.city && positions.city.goals > 0 && positions.city.total > 0
      ? Math.ceil((positions.city.rank / positions.city.total) * 100)
      : null;

  const normalizedRows = seasonRows.map((r) => ({
    leagueId:      r.leagueId,
    leagueName:    r.leagueName,
    teamId:        r.teamId,
    teamName:      r.teamName ?? "—",
    goals:         r.goals,
    matchesPlayed: r.matchesPlayed,
  }));

  const teamGoalShares  = await fetchTeamGoalShares(normalizedRows);
  const leaguesCount    = new Set(seasonRows.map((r) => r.leagueId)).size;
  const totalMatches    = seasonRows.reduce((s, r) => s + r.matchesPlayed, 0);
  const totalGoals      = seasonRows.reduce((s, r) => s + r.goals, 0);
  const overallGPM      = totalMatches > 0 ? totalGoals / totalMatches : 0;
  const badges          = computeBadges(positions, leaguesCount, mvpCount, streak, hatTricks, totalMatches, overallGPM);

  return { positions, cityTopPercent, goalStreak: streak, hatTricks, teamGoalShares, badges };
}

// ── Helpers de ego stats ──────────────────────────────────────────────────────

async function fetchGoalStreak(playerId: string): Promise<number> {
  const rows = await db
    .select({
      matchId:   matches.id,
      matchDate: matches.matchDate,
      goals:     sql<number>`count(case when ${matchEvents.eventType} = 'goal' then 1 end)::int`,
    })
    .from(matchEvents)
    .innerJoin(matches, eq(matchEvents.matchId, matches.id))
    .where(and(
      eq(matchEvents.playerId, playerId),
      eq(matches.status, "completed"),
    ))
    .groupBy(matches.id, matches.matchDate)
    .orderBy(desc(matches.matchDate));

  let streak = 0;
  for (const row of rows) {
    if (row.goals > 0) streak++;
    else break;
  }
  return streak;
}

async function fetchHatTricks(playerId: string): Promise<number> {
  const rows = await db
    .select({
      matchId: matchEvents.matchId,
      goals:   sql<number>`count(*)::int`,
    })
    .from(matchEvents)
    .innerJoin(matches, eq(matchEvents.matchId, matches.id))
    .where(and(
      eq(matchEvents.playerId, playerId),
      eq(matchEvents.eventType, "goal"),
      eq(matches.status, "completed"),
    ))
    .groupBy(matchEvents.matchId);

  return rows.filter((r) => r.goals >= 3).length;
}

async function fetchMvpCount(playerId: string): Promise<number> {
  const rows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(matchEvents)
    .where(and(
      eq(matchEvents.playerId, playerId),
      eq(matchEvents.eventType, "mvp"),
    ));
  return rows[0]?.count ?? 0;
}

type SeasonRow = { leagueId: string; leagueName: string; teamId: string | null; teamName: string; goals: number; matchesPlayed: number };

async function fetchTeamGoalShares(seasonRows: SeasonRow[]): Promise<PlayerTeamGoalShare[]> {
  const relevant = seasonRows.filter((r) => r.teamId !== null && r.goals > 0);
  if (relevant.length === 0) return [];

  const leagueIds = [...new Set(relevant.map((r) => r.leagueId))];
  const teamIds   = [...new Set(relevant.map((r) => r.teamId as string))];

  const totals = await db
    .select({
      leagueId:   playerSeasonStats.leagueId,
      teamId:     playerSeasonStats.teamId,
      teamGoals:  sql<number>`sum(${playerSeasonStats.goals})::int`,
    })
    .from(playerSeasonStats)
    .where(and(
      inArray(playerSeasonStats.leagueId, leagueIds),
      inArray(playerSeasonStats.teamId,   teamIds),
    ))
    .groupBy(playerSeasonStats.leagueId, playerSeasonStats.teamId);

  const teamTotalMap = new Map<string, number>();
  for (const row of totals) {
    if (!row.teamId) continue;
    teamTotalMap.set(`${row.leagueId}:${row.teamId}`, row.teamGoals);
  }

  return relevant
    .map((r) => {
      const teamGoals    = teamTotalMap.get(`${r.leagueId}:${r.teamId}`) ?? r.goals;
      const sharePercent = teamGoals > 0 ? Math.round((r.goals / teamGoals) * 100) : 0;
      return {
        leagueId:     r.leagueId,
        leagueName:   r.leagueName,
        teamName:     r.teamName,
        playerGoals:  r.goals,
        teamGoals,
        sharePercent,
      };
    })
    .filter((s) => s.sharePercent > 0);
}

function computeBadges(
  positions: PlayerPositions,
  leaguesCount: number,
  mvpCount: number,
  goalStreak: number,
  hatTricks: number,
  totalMatches: number,
  goalsPerMatch: number,
): PlayerBadge[] {
  const badges: PlayerBadge[] = [];
  if (positions.league?.rank === 1)               badges.push("league_top_scorer");
  if (leaguesCount >= 2)                          badges.push("multi_league");
  if (goalsPerMatch >= 1.0 && totalMatches >= 5)  badges.push("marksman");
  if (goalStreak >= 3)                            badges.push("on_streak");
  if (mvpCount > 0)                               badges.push("mvp");
  if (hatTricks > 0)                              badges.push("hat_trick_club");
  if (totalMatches >= 25)                         badges.push("veteran");
  return badges;
}

function emptyEgoStats(): PlayerEgoStats {
  return {
    positions: {
      league: null,
      city:   null,
      global: { rank: 0, total: 0, goals: 0 },
    },
    cityTopPercent:  null,
    goalStreak:      0,
    hatTricks:       0,
    teamGoalShares:  [],
    badges:          [],
  };
}
