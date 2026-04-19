/**
 * entities/player/ranking.ts
 * Queries para el ranking público de goleadores por ciudad.
 * Sin asistencias — no se registran en ligas amateur.
 */

import { eq, desc, sql, and } from "drizzle-orm";
import { db, players, playerSeasonStats, leagues, teams, playerRegistrations } from "@/db";

// ── Tipos ─────────────────────────────────────────────────────────────────────

export type RankingEntry = {
  playerId: string;
  fullName: string;
  alias: string | null;
  totalGoals: number;
  totalMatches: number;
  goalsPerMatch: number;
  leaguesCount: number;
  topLeague: string;        // liga con más goles
  topTeam: string;          // equipo en esa liga
};

export type JornadaHero = {
  playerId: string;
  fullName: string;
  alias: string | null;
  goals: number;
  matchesPlayed: number;
  goalsPerMatch: number;
  leagueName: string;
  teamName: string;
  jornada: number;
};

export type JornadaLeague = {
  leagueId: string;
  leagueName: string;
  season: string;
  dayOfWeek: string;
  jornada: number;
  heroes: JornadaHero[];  // top 3 de esa jornada
};

// ── Ranking de goleadores ─────────────────────────────────────────────────────

export async function getCityRanking(city: string): Promise<RankingEntry[]> {
  // Todos los player_season_stats de ligas de esta ciudad, con nombre del jugador
  const rows = await db
    .select({
      playerId:   playerSeasonStats.playerId,
      fullName:   players.fullName,
      alias:      players.alias,
      goals:      playerSeasonStats.goals,
      matches:    playerSeasonStats.matchesPlayed,
      leagueId:   playerSeasonStats.leagueId,
      leagueName: leagues.name,
      teamId:     playerSeasonStats.teamId,
      teamName:   teams.name,
    })
    .from(playerSeasonStats)
    .innerJoin(players, eq(playerSeasonStats.playerId, players.id))
    .innerJoin(leagues, eq(playerSeasonStats.leagueId, leagues.id))
    .leftJoin(teams, eq(playerSeasonStats.teamId, teams.id))
    .where(
      and(
        eq(leagues.city, city),
        sql`${playerSeasonStats.goals} > 0`,
      )
    );

  // Agrupar por jugador
  type Acc = {
    playerId: string;
    fullName: string;
    alias: string | null;
    totalGoals: number;
    totalMatches: number;
    leagues: { leagueId: string; leagueName: string; teamName: string; goals: number }[];
  };

  const map = new Map<string, Acc>();

  for (const row of rows) {
    if (!map.has(row.playerId)) {
      map.set(row.playerId, {
        playerId: row.playerId,
        fullName: row.fullName,
        alias: row.alias,
        totalGoals: 0,
        totalMatches: 0,
        leagues: [],
      });
    }
    const entry = map.get(row.playerId)!;
    entry.totalGoals   += row.goals;
    entry.totalMatches += row.matches;
    entry.leagues.push({
      leagueId:   row.leagueId,
      leagueName: row.leagueName,
      teamName:   row.teamName ?? "—",
      goals:      row.goals,
    });
  }

  // Construir ranking
  const ranking: RankingEntry[] = [];
  for (const acc of map.values()) {
    const bestLeague = acc.leagues.reduce((best, l) =>
      l.goals > best.goals ? l : best
    );
    ranking.push({
      playerId:     acc.playerId,
      fullName:     acc.fullName,
      alias:        acc.alias,
      totalGoals:   acc.totalGoals,
      totalMatches: acc.totalMatches,
      goalsPerMatch: acc.totalMatches > 0
        ? Math.round((acc.totalGoals / acc.totalMatches) * 100) / 100
        : 0,
      leaguesCount: acc.leagues.length,
      topLeague:    bestLeague.leagueName,
      topTeam:      bestLeague.teamName,
    });
  }

  // Ordenar: goles desc → goles/partido desc → nombre
  ranking.sort((a, b) => {
    if (b.totalGoals !== a.totalGoals) return b.totalGoals - a.totalGoals;
    if (b.goalsPerMatch !== a.goalsPerMatch) return b.goalsPerMatch - a.goalsPerMatch;
    return a.fullName.localeCompare(b.fullName);
  });

  return ranking;
}

// ── Tabla de honor por jornada ────────────────────────────────────────────────

export async function getJornadaHonor(city: string): Promise<JornadaLeague[]> {
  // Para cada liga de la ciudad, traer la jornada más reciente importada
  const cityLeagues = await db.query.leagues.findMany({
    where: eq(leagues.city, city),
  });

  if (cityLeagues.length === 0) return [];

  const results: JornadaLeague[] = [];

  for (const league of cityLeagues) {
    // Última jornada importada en esta liga
    const latestRow = await db
      .select({ maxJornada: sql<number>`max(jornada)::int` })
      .from(playerSeasonStats)
      .where(eq(playerSeasonStats.leagueId, league.id));

    const jornada = latestRow[0]?.maxJornada;
    if (!jornada) continue;

    // Top 3 goleadores de esa liga en esa jornada
    const topRows = await db
      .select({
        playerId:     playerSeasonStats.playerId,
        fullName:     players.fullName,
        alias:        players.alias,
        goals:        playerSeasonStats.goals,
        matchesPlayed: playerSeasonStats.matchesPlayed,
        teamName:     teams.name,
      })
      .from(playerSeasonStats)
      .innerJoin(players, eq(playerSeasonStats.playerId, players.id))
      .leftJoin(teams, eq(playerSeasonStats.teamId, teams.id))
      .where(
        and(
          eq(playerSeasonStats.leagueId, league.id),
          eq(playerSeasonStats.jornada, jornada),
          sql`${playerSeasonStats.goals} > 0`,
        )
      )
      .orderBy(desc(playerSeasonStats.goals))
      .limit(3);

    if (topRows.length === 0) continue;

    results.push({
      leagueId:   league.id,
      leagueName: league.name,
      season:     league.season,
      dayOfWeek:  league.dayOfWeek,
      jornada,
      heroes: topRows.map((r) => ({
        playerId:      r.playerId,
        fullName:      r.fullName,
        alias:         r.alias,
        goals:         r.goals,
        matchesPlayed: r.matchesPlayed,
        goalsPerMatch: r.matchesPlayed > 0
          ? Math.round((r.goals / r.matchesPlayed) * 100) / 100
          : 0,
        leagueName: league.name,
        teamName:   r.teamName ?? "—",
        jornada,
      })),
    });
  }

  // Ordenar ligas: más jornadas jugadas primero
  results.sort((a, b) => b.jornada - a.jornada);

  return results;
}
