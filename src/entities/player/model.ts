/**
 * entities/player/model.ts
 * Tipos del dominio para el perfil de jugador.
 * Cubre la visión cross-liga: un jugador puede estar en múltiples ligas
 * simultáneamente (mismo día, distinta hora/cancha).
 */

// Stats de un jugador en UNA liga específica
export type PlayerLeagueStats = {
  leagueId: string;
  leagueName: string;
  dayOfWeek: string;
  season: string;
  city: string;
  teamId: string | null;
  teamName: string;
  goals: number;
  assists: number;
  contributions: number;       // goals + assists
  yellowCards: number;
  redCards: number;
  mvpCount: number;
  matchesPlayed: number;
  goalsPerMatch: number;        // métrica principal de rendimiento
  source: "season_stats" | "match_events"; // de dónde vienen los datos
};

// Stats globales acumuladas de TODAS las ligas
export type PlayerGlobalProfile = {
  totalGoals: number;
  totalAssists: number;
  totalContributions: number;
  totalYellowCards: number;
  totalRedCards: number;
  totalMvp: number;
  totalMatches: number;
  leaguesCount: number;
  goalsPerMatch: number;        // métrica principal — normaliza diferencias de jornadas
};

// Posición de un jugador en los distintos scopes de ranking
export type PlayerPositions = {
  league: { rank: number; total: number; goals: number } | null;
  city:   { rank: number; total: number; goals: number; cityName: string } | null;
  global: { rank: number; total: number; goals: number };
};

// Participación porcentual del jugador en los goles de su equipo (por liga)
export type PlayerTeamGoalShare = {
  leagueId: string;
  leagueName: string;
  teamName: string;
  playerGoals: number;
  teamGoals: number;
  sharePercent: number; // 0-100
};

export type PlayerBadge =
  | "league_top_scorer" // #1 goleador en su mejor liga
  | "multi_league"      // jugando en 2+ ligas simultáneas
  | "on_streak"         // 3+ partidos consecutivos anotando
  | "mvp"               // tiene registros de MVP
  | "hat_trick_club"    // 3+ goles en algún partido
  | "marksman"          // promedio >= 1.0 gol/partido (mínimo 5 PJ)
  | "veteran";          // 25+ partidos jugados en total

// Stats de ego calculadas en el backend — para el perfil público del jugador
export type PlayerEgoStats = {
  positions: PlayerPositions;
  cityTopPercent: number | null; // Math.ceil(rank / total * 100), null si no aplica
  goalStreak: number;            // partidos consecutivos anotando (racha activa)
  hatTricks: number;             // cantidad de hat-tricks históricos
  teamGoalShares: PlayerTeamGoalShare[];
  badges: PlayerBadge[];
};

// Perfil completo del jugador
export type PlayerProfile = {
  id: string;
  fullName: string;
  alias: string | null;
  phone: string | null;
  photoUrl: string | null;
  global: PlayerGlobalProfile;
  leagues: PlayerLeagueStats[]; // ordenadas: más goles primero
};
