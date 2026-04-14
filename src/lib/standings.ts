import { db, matches, teams, teamStandingsSnapshot } from "@/db";
import { eq, and, desc } from "drizzle-orm";
import type { TeamStanding } from "@/types";

/**
 * Devuelve la tabla de posiciones de una liga.
 * Prioridad: snapshots importados desde Excel (última jornada disponible).
 * Fallback: calcula desde resultados de partidos.
 */
export async function getLeagueStandings(leagueId: string): Promise<TeamStanding[]> {
  // Verificar si hay snapshots importados
  const snapshots = await db.query.teamStandingsSnapshot.findMany({
    where: eq(teamStandingsSnapshot.leagueId, leagueId),
    orderBy: [desc(teamStandingsSnapshot.jornada), desc(teamStandingsSnapshot.points)],
    with: { team: true, league: true },
  });

  if (snapshots.length > 0) {
    // Tomar solo la jornada más reciente (la primera, ya que ordenamos desc)
    const latestJornada = snapshots[0].jornada;
    const latest = snapshots.filter((s) => s.jornada === latestJornada);

    return latest
      .map((s) => ({
        teamId: s.teamId,
        teamName: s.team.name,
        leagueId,
        leagueName: s.league.name,
        season: s.league.season,
        played: s.played,
        wins: s.wins,
        draws: s.draws,
        losses: s.losses,
        goalsFor: s.goalsFor,
        goalsAgainst: s.goalsAgainst,
        goalDifference: s.goalsFor - s.goalsAgainst,
        points: s.points,
        zone: s.zone ?? undefined,
      }))
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        const aDiff = a.goalsFor - a.goalsAgainst;
        const bDiff = b.goalsFor - b.goalsAgainst;
        if (bDiff !== aDiff) return bDiff - aDiff;
        if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
        return a.teamName.localeCompare(b.teamName);
      });
  }

  // Fallback: calcular desde partidos
  const leagueTeams = await db.query.teams.findMany({
    where: eq(teams.leagueId, leagueId),
    with: { league: true },
  });

  const completedMatches = await db.query.matches.findMany({
    where: and(
      eq(matches.leagueId, leagueId),
      eq(matches.status, "completed")
    ),
  });

  const standings: TeamStanding[] = leagueTeams.map((team) => {
    let wins = 0, draws = 0, losses = 0, goalsFor = 0, goalsAgainst = 0;

    for (const match of completedMatches) {
      const isHome = match.homeTeamId === team.id;
      const isAway = match.awayTeamId === team.id;
      if (!isHome && !isAway) continue;

      const myGoals = isHome ? match.homeScore : match.awayScore;
      const theirGoals = isHome ? match.awayScore : match.homeScore;

      goalsFor += myGoals;
      goalsAgainst += theirGoals;

      if (myGoals > theirGoals) wins++;
      else if (myGoals === theirGoals) draws++;
      else losses++;
    }

    const played = wins + draws + losses;
    const points = wins * 3 + draws;
    const goalDifference = goalsFor - goalsAgainst;

    return {
      teamId: team.id,
      teamName: team.name,
      leagueId,
      leagueName: team.league.name,
      season: team.league.season,
      played,
      wins,
      draws,
      losses,
      goalsFor,
      goalsAgainst,
      goalDifference,
      points,
    };
  });

  // Ordenar: puntos → diferencia de goles → goles a favor → nombre
  return standings.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    return a.teamName.localeCompare(b.teamName);
  });
}
