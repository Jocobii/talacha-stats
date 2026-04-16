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
