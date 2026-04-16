import {
  pgTable,
  uuid,
  text,
  integer,
  date,
  timestamp,
  unique,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ---------------------------------------------------------------------------
// PLAYERS — Identidad global del jugador (independiente de liga/equipo)
// ---------------------------------------------------------------------------
export const players = pgTable("players", {
  id: uuid("id").primaryKey().defaultRandom(),
  fullName: text("full_name").notNull(),
  alias: text("alias"), // apodo: "El Chino", "Chucky"
  phone: text("phone"),
  photoUrl: text("photo_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// LEAGUES — Liga por día/torneo (Liga Lunes, Liga Martes, etc.)
// ---------------------------------------------------------------------------
export const leagues = pgTable("leagues", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  dayOfWeek: text("day_of_week").notNull(), // lunes | martes | miercoles | ...
  season: text("season").notNull(), // "Apertura 2025"
  adminId: uuid("admin_id"), // referencia a auth.users de Supabase
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// TEAMS — Equipo SIEMPRE scoped a una liga (Pepe Lunes ≠ Pepe Martes)
// ---------------------------------------------------------------------------
export const teams = pgTable(
  "teams",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    leagueId: uuid("league_id")
      .notNull()
      .references(() => leagues.id, { onDelete: "cascade" }),
    color: text("color"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("teams_league_idx").on(t.leagueId)]
);

// ---------------------------------------------------------------------------
// PLAYER_REGISTRATIONS — Participación jugador ↔ equipo ↔ liga
// Un jugador solo puede estar en UN equipo por liga (UNIQUE player_id + league_id)
// ---------------------------------------------------------------------------
export const playerRegistrations = pgTable(
  "player_registrations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    playerId: uuid("player_id")
      .notNull()
      .references(() => players.id, { onDelete: "cascade" }),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    leagueId: uuid("league_id")
      .notNull()
      .references(() => leagues.id, { onDelete: "cascade" }),
    jerseyNumber: integer("jersey_number"),
    registeredAt: timestamp("registered_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    unique("unique_player_per_league").on(t.playerId, t.leagueId),
    index("registrations_player_idx").on(t.playerId),
    index("registrations_team_idx").on(t.teamId),
    index("registrations_league_idx").on(t.leagueId),
  ]
);

// ---------------------------------------------------------------------------
// MATCHES — Partido entre dos equipos de la misma liga
// ---------------------------------------------------------------------------
export const matches = pgTable(
  "matches",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    leagueId: uuid("league_id")
      .notNull()
      .references(() => leagues.id, { onDelete: "cascade" }),
    homeTeamId: uuid("home_team_id")
      .notNull()
      .references(() => teams.id),
    awayTeamId: uuid("away_team_id")
      .notNull()
      .references(() => teams.id),
    matchDate: date("match_date").notNull(),
    matchday: integer("matchday"), // jornada
    status: text("status").notNull().default("scheduled"), // scheduled | completed | cancelled
    homeScore: integer("home_score").notNull().default(0),
    awayScore: integer("away_score").notNull().default(0),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("matches_league_idx").on(t.leagueId),
    index("matches_date_idx").on(t.matchDate),
    index("matches_status_idx").on(t.status),
  ]
);

// ---------------------------------------------------------------------------
// MATCH_EVENTS — Cada gol, asistencia, tarjeta en un partido
// Fuente de verdad para TODAS las estadísticas
// ---------------------------------------------------------------------------
export const matchEvents = pgTable(
  "match_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    matchId: uuid("match_id")
      .notNull()
      .references(() => matches.id, { onDelete: "cascade" }),
    playerId: uuid("player_id")
      .notNull()
      .references(() => players.id),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id),
    eventType: text("event_type").notNull(), // goal | assist | yellow_card | red_card | own_goal | mvp
    minute: integer("minute"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("events_match_idx").on(t.matchId),
    index("events_player_idx").on(t.playerId),
    index("events_type_idx").on(t.eventType),
  ]
);

// ---------------------------------------------------------------------------
// RELATIONS (para queries con Drizzle relational API)
// ---------------------------------------------------------------------------
export const playersRelations = relations(players, ({ many }) => ({
  registrations: many(playerRegistrations),
  events: many(matchEvents),
}));

export const leaguesRelations = relations(leagues, ({ many }) => ({
  teams: many(teams),
  matches: many(matches),
  registrations: many(playerRegistrations),
}));

export const teamsRelations = relations(teams, ({ one, many }) => ({
  league: one(leagues, { fields: [teams.leagueId], references: [leagues.id] }),
  registrations: many(playerRegistrations),
  homeMatches: many(matches, { relationName: "homeTeam" }),
  awayMatches: many(matches, { relationName: "awayTeam" }),
  events: many(matchEvents),
}));

export const playerRegistrationsRelations = relations(playerRegistrations, ({ one }) => ({
  player: one(players, { fields: [playerRegistrations.playerId], references: [players.id] }),
  team: one(teams, { fields: [playerRegistrations.teamId], references: [teams.id] }),
  league: one(leagues, { fields: [playerRegistrations.leagueId], references: [leagues.id] }),
}));

export const matchesRelations = relations(matches, ({ one, many }) => ({
  league: one(leagues, { fields: [matches.leagueId], references: [leagues.id] }),
  homeTeam: one(teams, { fields: [matches.homeTeamId], references: [teams.id], relationName: "homeTeam" }),
  awayTeam: one(teams, { fields: [matches.awayTeamId], references: [teams.id], relationName: "awayTeam" }),
  events: many(matchEvents),
}));

export const matchEventsRelations = relations(matchEvents, ({ one }) => ({
  match: one(matches, { fields: [matchEvents.matchId], references: [matches.id] }),
  player: one(players, { fields: [matchEvents.playerId], references: [players.id] }),
  team: one(teams, { fields: [matchEvents.teamId], references: [teams.id] }),
}));

// ---------------------------------------------------------------------------
// TIPOS inferidos
// ---------------------------------------------------------------------------
export type Player = typeof players.$inferSelect;
export type NewPlayer = typeof players.$inferInsert;
export type League = typeof leagues.$inferSelect;
export type NewLeague = typeof leagues.$inferInsert;
export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;
export type PlayerRegistration = typeof playerRegistrations.$inferSelect;
export type NewPlayerRegistration = typeof playerRegistrations.$inferInsert;
export type Match = typeof matches.$inferSelect;
export type NewMatch = typeof matches.$inferInsert;
export type MatchEvent = typeof matchEvents.$inferSelect;
export type NewMatchEvent = typeof matchEvents.$inferInsert;

// ---------------------------------------------------------------------------
// PLAYER_SEASON_STATS — Stats acumuladas importadas desde Excel (goleadores)
// Fuente directa cuando no hay eventos de partido registrados.
// UNIQUE (player_id, league_id) — una fila por jugador por liga.
// ---------------------------------------------------------------------------
export const playerSeasonStats = pgTable(
  "player_season_stats",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    playerId: uuid("player_id")
      .notNull()
      .references(() => players.id, { onDelete: "cascade" }),
    leagueId: uuid("league_id")
      .notNull()
      .references(() => leagues.id, { onDelete: "cascade" }),
    teamId: uuid("team_id")
      .references(() => teams.id, { onDelete: "set null" }),
    // Stats acumuladas (se sobreescriben en cada importación)
    matchesPlayed: integer("matches_played").notNull().default(0),
    goals: integer("goals").notNull().default(0),
    assists: integer("assists").notNull().default(0),
    yellowCards: integer("yellow_cards").notNull().default(0),
    redCards: integer("red_cards").notNull().default(0),
    jornada: integer("jornada"), // última jornada importada
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    unique("unique_player_season").on(t.playerId, t.leagueId),
    index("pss_player_idx").on(t.playerId),
    index("pss_league_idx").on(t.leagueId),
  ]
);

// ---------------------------------------------------------------------------
// TEAM_STANDINGS_SNAPSHOT — Tabla de posiciones importada desde Excel
// Un registro por equipo por jornada importada.
// ---------------------------------------------------------------------------
export const teamStandingsSnapshot = pgTable(
  "team_standings_snapshot",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    leagueId: uuid("league_id")
      .notNull()
      .references(() => leagues.id, { onDelete: "cascade" }),
    jornada: integer("jornada").notNull(),
    played: integer("played").notNull().default(0),
    wins: integer("wins").notNull().default(0),
    draws: integer("draws").notNull().default(0),
    losses: integer("losses").notNull().default(0),
    goalsFor: integer("goals_for").notNull().default(0),
    goalsAgainst: integer("goals_against").notNull().default(0),
    points: integer("points").notNull().default(0),
    zone: text("zone"), // LIGUILLA | COPA | RECOPA | null
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    unique("unique_team_jornada").on(t.teamId, t.leagueId, t.jornada),
    index("tss_league_idx").on(t.leagueId),
    index("tss_jornada_idx").on(t.jornada),
  ]
);

// Relations para las nuevas tablas
export const playerSeasonStatsRelations = relations(playerSeasonStats, ({ one }) => ({
  player: one(players, { fields: [playerSeasonStats.playerId], references: [players.id] }),
  league: one(leagues, { fields: [playerSeasonStats.leagueId], references: [leagues.id] }),
  team: one(teams, { fields: [playerSeasonStats.teamId], references: [teams.id] }),
}));

export const teamStandingsSnapshotRelations = relations(teamStandingsSnapshot, ({ one }) => ({
  team: one(teams, { fields: [teamStandingsSnapshot.teamId], references: [teams.id] }),
  league: one(leagues, { fields: [teamStandingsSnapshot.leagueId], references: [leagues.id] }),
}));

export type PlayerSeasonStats = typeof playerSeasonStats.$inferSelect;
export type NewPlayerSeasonStats = typeof playerSeasonStats.$inferInsert;
export type TeamStandingsSnapshot = typeof teamStandingsSnapshot.$inferSelect;
export type NewTeamStandingsSnapshot = typeof teamStandingsSnapshot.$inferInsert;

// ---------------------------------------------------------------------------
// IMPORT_TEMPLATES — Plantillas de mapeo de columnas para importación Excel
// Guarda qué columna del Excel corresponde a cada campo del sistema.
// ---------------------------------------------------------------------------
export const importTemplates = pgTable("import_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),                    // "Formato Goleadores Liga Lunes"
  type: text("type").notNull(),                    // "goleadores" | "standings"
  headerRow: integer("header_row").notNull().default(0), // índice de fila con encabezados (0-based)
  columnMap: text("column_map").notNull(),         // JSON: { rawName: "B", goals: "D", ... }
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type ImportTemplate = typeof importTemplates.$inferSelect;
export type NewImportTemplate = typeof importTemplates.$inferInsert;

// ColumnMap tipado — mapa de campo → letra de columna o nombre de encabezado
export type GoleadoresColumnMap = {
  rawName: string;   // columna del nombre del jugador
  teamName?: string; // columna del equipo
  goals: string;     // columna de goles
  assists?: string;
  yellowCards?: string;
  redCards?: string;
  matchesPlayed?: string;
};

export type StandingsColumnMap = {
  teamName: string;
  played?: string;
  wins?: string;
  draws?: string;
  losses?: string;
  goalsFor?: string;
  goalsAgainst?: string;
  points: string;
};

// ---------------------------------------------------------------------------
// PAGE_VIEWS — Contador de visitas únicas a las páginas públicas
// visitor_id: UUID persistido en cookie (1 año) para identificar al navegador
// ---------------------------------------------------------------------------
export const pageViews = pgTable(
  "page_views",
  {
    id:         uuid("id").primaryKey().defaultRandom(),
    visitorId:  uuid("visitor_id").notNull(),
    page:       text("page").notNull(), // pathname: "/", "/jugadores", "/jugador/[id]", "/analisis"
    visitedAt:  timestamp("visited_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("pv_visitor_idx").on(t.visitorId),
    index("pv_page_idx").on(t.page),
    index("pv_visited_at_idx").on(t.visitedAt),
  ]
);

export type PageView = typeof pageViews.$inferSelect;

export const EVENT_TYPES = ["goal", "assist", "yellow_card", "red_card", "own_goal", "mvp"] as const;
export type EventType = typeof EVENT_TYPES[number];

export const MATCH_STATUSES = ["scheduled", "completed", "cancelled"] as const;
export type MatchStatus = typeof MATCH_STATUSES[number];

export const DAYS_OF_WEEK = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"] as const;
export type DayOfWeek = typeof DAYS_OF_WEEK[number];
