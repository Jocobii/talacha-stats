import { z } from "zod";
import { EVENT_TYPES, MATCH_STATUSES, DAYS_OF_WEEK } from "@/db/schema";

// ---------------------------------------------------------------------------
// Schemas de validación Zod
// ---------------------------------------------------------------------------

export const CreatePlayerSchema = z.object({
  fullName: z.string().min(2).max(100),
  alias: z.string().max(50).optional(),
  phone: z.string().max(20).optional(),
  photoUrl: z.string().url().optional(),
});

export const UpdatePlayerSchema = CreatePlayerSchema.partial();

export const CreateLeagueSchema = z.object({
  name: z.string().min(2).max(100),
  dayOfWeek: z.enum(DAYS_OF_WEEK),
  season: z.string().min(2).max(50),
});

export const UpdateLeagueSchema = CreateLeagueSchema.partial();

export const CreateTeamSchema = z.object({
  name: z.string().min(1).max(100),
  leagueId: z.string().uuid(),
  color: z.string().max(30).optional(),
});

export const UpdateTeamSchema = CreateTeamSchema.partial().omit({ leagueId: true });

export const RegisterPlayerSchema = z.object({
  playerId: z.string().uuid(),
  teamId: z.string().uuid(),
  leagueId: z.string().uuid(),
  jerseyNumber: z.number().int().min(1).max(99).optional(),
});

export const CreateMatchSchema = z.object({
  leagueId: z.string().uuid(),
  homeTeamId: z.string().uuid(),
  awayTeamId: z.string().uuid(),
  matchDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  matchday: z.number().int().min(1).optional(),
  notes: z.string().max(500).optional(),
});

export const UpdateMatchSchema = z.object({
  homeScore: z.number().int().min(0).optional(),
  awayScore: z.number().int().min(0).optional(),
  status: z.enum(MATCH_STATUSES).optional(),
  matchDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  matchday: z.number().int().min(1).optional(),
  notes: z.string().max(500).optional(),
});

export const CreateMatchEventSchema = z.object({
  playerId: z.string().uuid(),
  teamId: z.string().uuid(),
  eventType: z.enum(EVENT_TYPES),
  minute: z.number().int().min(1).max(120).optional(),
});

// ---------------------------------------------------------------------------
// Tipos de respuesta para las APIs
// ---------------------------------------------------------------------------

export type PlayerStats = {
  playerId: string;
  fullName: string;
  alias: string | null;
  leagueId: string;
  leagueName: string;
  season: string;
  teamId: string;
  teamName: string;
  matchesPlayed: number;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  ownGoals: number;
  mvpCount: number;
};

export type PlayerGlobalStats = {
  playerId: string;
  fullName: string;
  alias: string | null;
  totalMatches: number;
  totalGoals: number;
  totalAssists: number;
  totalYellowCards: number;
  totalRedCards: number;
  totalOwnGoals: number;
  totalMvp: number;
  leaguesCount: number;
};

export type TeamStanding = {
  teamId: string;
  teamName: string;
  leagueId: string;
  leagueName: string;
  season: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  zone?: string; // LIGUILLA | COPA | RECOPA — solo en imports desde Excel
};

export type DangerRating = "ALTO" | "MEDIO" | "BAJO";

export type TopThreat = {
  playerId: string;
  player: string;
  alias: string | null;
  goalsThisSeason: number;
  goalsLast3Matches: number;
  assists: number;
  goalsPerMatch: number;
  dangerRating: DangerRating;
};

export type CardRiskPlayer = {
  playerId: string;
  player: string;
  yellowCards: number;
  redCards: number;
  note: string;
};

export type HeadToHead = {
  totalMatches: number;
  homeWins: number;
  draws: number;
  awayWins: number;
  lastMatch: { date: string; result: string } | null;
};

export type MatchPreview = {
  match: {
    id: string;
    homeTeam: string;
    awayTeam: string;
    league: string;
    matchday: number | null;
    date: string;
  };
  teamForm: {
    home: TeamFormStats;
    away: TeamFormStats;
  };
  winProbability: {
    homeWinPct: number;
    drawPct: number;
    awayWinPct: number;
    method: string;
  };
  topThreats: {
    home: TopThreat[];
    away: TopThreat[];
  };
  cardRisk: {
    home: CardRiskPlayer[];
    away: CardRiskPlayer[];
  };
  headToHead: HeadToHead;
  narratorBullets: string[];
};

export type TeamFormStats = {
  record: { wins: number; draws: number; losses: number };
  points: number;
  goalsScored: number;
  goalsConceded: number;
  avgGoalsPerMatch: number;
  last5: ("W" | "D" | "L")[];
};

// ---------------------------------------------------------------------------
// Helpers de respuesta API
// ---------------------------------------------------------------------------
export function apiSuccess<T>(data: T, status = 200) {
  return Response.json({ ok: true, data }, { status });
}

export function apiSuccessPaginated<T>(
  data: T[],
  meta: import("@/shared/lib/pagination").PaginationMeta,
  status = 200
) {
  return Response.json({ ok: true, data, meta }, { status });
}

export function apiError(message: string, status = 400) {
  return Response.json({ ok: false, error: message }, { status });
}
