import {
	pgTable,
	pgView,
	uuid,
	text,
	integer,
	boolean,
	date,
	timestamp,
	unique,
	index,
	jsonb,
	check,
} from "drizzle-orm/pg-core";
import { sql as drizzleSql } from "drizzle-orm";
import { relations } from "drizzle-orm";

// ---------------------------------------------------------------------------
// ORGANIZATIONS — Entidad organizadora (Novofut, Casablanca, Furati…)
// Una organización tiene múltiples usuarios y múltiples ligas.
// ---------------------------------------------------------------------------
export const organizations = pgTable(
	"organizations",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		name: text("name").notNull(),
		slug: text("slug").notNull().unique(), // URL-friendly: "novofut", "casablanca-fc"
		logoUrl: text("logo_url"),
		city: text("city").notNull().default("Tijuana"),
		// "trial" = recién registrada, datos no aparecen en vistas cross-org
		// "verified" = verificada manualmente, aparece en rankings globales
		status: text("status").notNull().default("trial"), // "trial" | "verified"
		verificationRequestedAt: timestamp("verification_requested_at", {
			withTimezone: true,
		}),
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(t) => [index("organizations_slug_idx").on(t.slug)],
);

export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;
export const ORG_STATUSES = ["trial", "verified"] as const;
export type OrgStatus = (typeof ORG_STATUSES)[number];

// ---------------------------------------------------------------------------
// USERS — Cuentas de acceso al panel admin
// Roles: "owner" (superadmin, ve todo) | "organizer" (solo su organización)
// Un usuario pertenece a máximo una organización (organization_id nullable).
// ---------------------------------------------------------------------------
export const users = pgTable(
	"users",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		email: text("email").notNull().unique(),
		passwordHash: text("password_hash").notNull(),
		name: text("name").notNull(),
		role: text("role").notNull().default("organizer"), // "owner" | "organizer"
		active: boolean("active").notNull().default(true),
		organizationId: uuid("organization_id").references(() => organizations.id, {
			onDelete: "set null",
		}),
		// Verificación de email — requerida para acceder al panel
		emailVerified: boolean("email_verified").notNull().default(false),
		emailVerificationToken: text("email_verification_token").unique(),
		emailVerificationExpiresAt: timestamp("email_verification_expires_at", {
			withTimezone: true,
		}),
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(t) => [
		index("users_email_idx").on(t.email),
		index("users_organization_idx").on(t.organizationId),
	],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

// ---------------------------------------------------------------------------
// PLAYERS — Identidad global del jugador (independiente de liga/equipo)
// Historia 02: pasa a ser la capa global de la identidad en dos capas.
// La capa local es player_profiles (ver abajo).
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
// GLOBAL_PLAYERS — Identidad global anclada en CURP (Breaking Change)
//
// Reemplaza a `players` como anchor de identidad entre ligas y organizaciones.
// curp_hash = sha256(CURP) generado en servidor — el CURP nunca se almacena.
// Inmutable después del primer registro (modificable solo por superadmin).
//
// Jugadores migrados del sistema anterior usan dummy hash:
//   curp_hash = sha256("PENDING_" + legacy_player_id)
// El oficinista los regulariza cuando vuelven a ventanilla con su INE.
// ---------------------------------------------------------------------------
export const globalPlayers = pgTable(
	"global_players",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		curpHash: text("curp_hash").notNull().unique(), // sha256(CURP) — nunca el CURP real
		fullName: text("full_name").notNull(),
		// Forma canónica del nombre: sin acentos (salvo Ñ), sin puntuación, lowercase.
		// Generado por sanitizeToCanonical() en shared/lib/normalize.ts.
		// Se usa para búsquedas y agrupaciones cross-liga sin depender de f_unaccent en PG.
		fullNameCanonical: text("full_name_canonical"),
		birthDate: date("birth_date").notNull(),
		avatarUrl: text("avatar_url"),
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(t) => [
		index("global_players_curp_idx").on(t.curpHash),
		index("global_players_name_canonical_idx").on(t.fullNameCanonical),
	],
);

export type GlobalPlayer = typeof globalPlayers.$inferSelect;
export type NewGlobalPlayer = typeof globalPlayers.$inferInsert;

// ---------------------------------------------------------------------------
// PLAYER_PROFILES — Identidad local a la organización (Historia 02)
// @deprecated — reemplazada por league_members (Breaking Change admin ecosystem)
// Se mantiene durante la transición. No agregar nuevas referencias a esta tabla.
//
// Capa local de la identidad en dos capas:
//   player_profile  →  (opcional) claimed_player_id  →  players (global)
//
// claim_status:
//   unclaimed  → perfil local sin vínculo a identidad global
//   proposed   → el sistema propone un merge cruzado (pendiente validación)
//   verified   → el owner ha confirmado que es la misma persona
//   rejected   → el owner rechazó el vínculo propuesto
//
// UNIQUE (organization_id, normalized_name): un jugador por nombre normalizado
// por org. Los duplicados legacy se resuelven durante el backfill.
// ---------------------------------------------------------------------------
export const CLAIM_STATUSES = ["unclaimed", "proposed", "verified", "rejected"] as const;
export type ClaimStatus = (typeof CLAIM_STATUSES)[number];

export const playerProfiles = pgTable(
	"player_profiles",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizations.id, { onDelete: "cascade" }),
		fullName: text("full_name").notNull(),
		alias: text("alias"),
		normalizedName: text("normalized_name").notNull(),
		fingerprint: text("fingerprint").notNull(),
		// Vínculo a la identidad global (nullable — puede estar unclaimed)
		claimedPlayerId: uuid("claimed_player_id").references(() => players.id, {
			onDelete: "set null",
		}),
		claimStatus: text("claim_status").notNull().default("unclaimed").$type<ClaimStatus>(),
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(t) => [
		unique("uq_player_profile_org_name").on(t.organizationId, t.normalizedName),
		index("idx_player_profiles_org").on(t.organizationId),
		index("idx_player_profiles_claimed").on(t.claimedPlayerId),
		index("idx_player_profiles_normalized").on(t.normalizedName),
		check(
			"chk_claim_status",
			drizzleSql`${t.claimStatus} IN ('unclaimed','proposed','verified','rejected')`,
		),
	],
);

export type PlayerProfile = typeof playerProfiles.$inferSelect;
export type NewPlayerProfile = typeof playerProfiles.$inferInsert;

// ---------------------------------------------------------------------------
// LEAGUES — Liga por día/torneo (Liga Lunes, Liga Martes, etc.)
// ---------------------------------------------------------------------------
export const leagues = pgTable("leagues", {
	id: uuid("id").primaryKey().defaultRandom(),
	name: text("name").notNull(),
	// Forma canónica del nombre: sin acentos (salvo Ñ), sin puntuación, lowercase.
	// Generado por sanitizeToCanonical() en shared/lib/normalize.ts.
	nameCanonical: text("name_canonical"),
	slug: text("slug"), // URL-friendly, único por organización
	category: text("category"), // "Libre", "Libre Femenil", "2015-2016", "Mixto"
	dayOfWeek: text("day_of_week").notNull(), // lunes | martes | miercoles | ...
	season: text("season").notNull(), // "Apertura 2025"
	city: text("city").notNull().default("Tijuana"),
	organizationId: uuid("organization_id").references(() => organizations.id, {
		onDelete: "set null",
	}),
	status: text("status").notNull().default("active"), // "active" | "finished"
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
		// Forma canónica del nombre: sin acentos (salvo Ñ), sin puntuación, lowercase.
		// Generado por sanitizeToCanonical() en shared/lib/normalize.ts.
		// Constraint UNIQUE(league_id, name_canonical) impide duplicados en la misma liga.
		nameCanonical: text("name_canonical"),
		leagueId: uuid("league_id")
			.notNull()
			.references(() => leagues.id, { onDelete: "cascade" }),
		color: text("color"),
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(t) => [
		index("teams_league_idx").on(t.leagueId),
		// Previene dos equipos con el mismo nombre canónico en la misma liga.
		// "Deportivo FC" y "Deportivo F.C." colisionan → error de negocio claro.
		unique("uq_teams_league_canonical").on(t.leagueId, t.nameCanonical),
	],
);

// ---------------------------------------------------------------------------
// PLAYER_REGISTRATIONS — Participación jugador ↔ equipo ↔ liga
//
// Historia 02: se agrega player_profile_id (capa local) como FK principal.
// El campo legacy_player_id conserva la FK original a players.id durante
// el período de transición; se elimina en migración posterior.
// ---------------------------------------------------------------------------
export const playerRegistrations = pgTable(
	"player_registrations",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		// Nueva FK — capa local (Historia 02)
		playerProfileId: uuid("player_profile_id").references(() => playerProfiles.id, {
			onDelete: "cascade",
		}),
		// FK original mantenida como legacy durante transición
		legacyPlayerId: uuid("legacy_player_id").references(() => players.id, {
			onDelete: "set null",
		}),
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
		unique("unique_profile_per_league").on(t.playerProfileId, t.leagueId),
		index("registrations_profile_idx").on(t.playerProfileId),
		index("registrations_legacy_player_idx").on(t.legacyPlayerId),
		index("registrations_team_idx").on(t.teamId),
		index("registrations_league_idx").on(t.leagueId),
	],
);

// ---------------------------------------------------------------------------
// LEAGUE_MEMBERS — Identidad local scoped por liga (Breaking Change)
//
// Reemplaza a `player_profiles` (que era por organización) y absorbe la
// relación de pertenencia que tenía `player_registrations`.
// Scope más granular: un registro por jugador × liga.
//
// Data siloing: institution_photo_url e internal_notes son PRIVADOS de cada
// liga. Nunca se exponen en queries cross-liga. Se hace a nivel de queries.
// ---------------------------------------------------------------------------
export const LEAGUE_MEMBER_STATUSES = ["active", "suspended", "inactive"] as const;
export type LeagueMemberStatus = (typeof LEAGUE_MEMBER_STATUSES)[number];

export const leagueMembers = pgTable(
	"league_members",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		globalPlayerId: uuid("global_player_id")
			.notNull()
			.references(() => globalPlayers.id, { onDelete: "cascade" }),
		leagueId: uuid("league_id")
			.notNull()
			.references(() => leagues.id, { onDelete: "cascade" }),
		status: text("status").notNull().default("active").$type<LeagueMemberStatus>(),
		dorsal: integer("dorsal"), // nullable — no todos los equipos usan dorsales
		inscriptionDate: date("inscription_date").notNull(),
		institutionPhotoUrl: text("institution_photo_url"), // foto tomada por la institución
		internalNotes: text("internal_notes"), // notas privadas de la liga — data siloing
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(t) => [
		unique("uq_league_member").on(t.globalPlayerId, t.leagueId),
		index("league_members_global_player_idx").on(t.globalPlayerId),
		index("league_members_league_idx").on(t.leagueId),
		check("chk_league_member_status", drizzleSql`${t.status} IN ('active','suspended','inactive')`),
		check(
			"chk_dorsal_range",
			drizzleSql`${t.dorsal} IS NULL OR (${t.dorsal} >= 1 AND ${t.dorsal} <= 99)`,
		),
	],
);

export type LeagueMember = typeof leagueMembers.$inferSelect;
export type NewLeagueMember = typeof leagueMembers.$inferInsert;

// ---------------------------------------------------------------------------
// INSCRIPTIONS — Asignación de un league_member a un equipo (Breaking Change)
//
// Liga = torneo (decisión de diseño). UNIQUE(league_member_id) garantiza que
// un jugador solo puede pertenecer a un equipo por liga.
// Para cambiar de equipo: se elimina la inscripción anterior y se crea una nueva.
// ---------------------------------------------------------------------------
export const inscriptions = pgTable(
	"inscriptions",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		leagueMemberId: uuid("league_member_id")
			.notNull()
			.references(() => leagueMembers.id, { onDelete: "cascade" }),
		teamId: uuid("team_id")
			.notNull()
			.references(() => teams.id, { onDelete: "cascade" }),
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(t) => [
		unique("uq_inscription_member").on(t.leagueMemberId), // un equipo por jugador por liga
		index("inscriptions_team_idx").on(t.teamId),
	],
);

export type Inscription = typeof inscriptions.$inferSelect;
export type NewInscription = typeof inscriptions.$inferInsert;

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
	],
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
		// FK nuevo ecosistema admin (Breaking Change)
		globalPlayerId: uuid("global_player_id").references(() => globalPlayers.id, {
			onDelete: "set null",
		}),
		leagueMemberId: uuid("league_member_id").references(() => leagueMembers.id, {
			onDelete: "set null",
		}),
		// @deprecated — capa local Historia 02, mantener durante transición
		playerProfileId: uuid("player_profile_id").references(() => playerProfiles.id, {
			onDelete: "cascade",
		}),
		// @deprecated — FK original legacy
		legacyPlayerId: uuid("legacy_player_id").references(() => players.id, {
			onDelete: "set null",
		}),
		teamId: uuid("team_id")
			.notNull()
			.references(() => teams.id),
		eventType: text("event_type").notNull(), // goal | assist | yellow_card | red_card | own_goal | mvp
		minute: integer("minute"),
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(t) => [
		index("events_match_idx").on(t.matchId),
		index("events_global_player_idx").on(t.globalPlayerId),
		index("events_league_member_idx").on(t.leagueMemberId),
		index("events_profile_idx").on(t.playerProfileId),
		index("events_legacy_player_idx").on(t.legacyPlayerId),
		index("events_type_idx").on(t.eventType),
	],
);

// ---------------------------------------------------------------------------
// RELATIONS (para queries con Drizzle relational API)
// ---------------------------------------------------------------------------
export const globalPlayersRelations = relations(globalPlayers, ({ many }) => ({
	leagueMembers: many(leagueMembers),
}));

export const leagueMembersRelations = relations(leagueMembers, ({ one, many }) => ({
	globalPlayer: one(globalPlayers, {
		fields: [leagueMembers.globalPlayerId],
		references: [globalPlayers.id],
	}),
	league: one(leagues, {
		fields: [leagueMembers.leagueId],
		references: [leagues.id],
	}),
	inscription: many(inscriptions),
}));

export const inscriptionsRelations = relations(inscriptions, ({ one }) => ({
	leagueMember: one(leagueMembers, {
		fields: [inscriptions.leagueMemberId],
		references: [leagueMembers.id],
	}),
	team: one(teams, {
		fields: [inscriptions.teamId],
		references: [teams.id],
	}),
}));

export const organizationsRelations = relations(organizations, ({ many }) => ({
	leagues: many(leagues),
	members: many(users),
	playerProfiles: many(playerProfiles),
}));

export const playersRelations = relations(players, ({ many }) => ({
	// Legacy relations — maintained for compatibility during Historia 02 transition
	events: many(matchEvents),
	// Profiles that claim this global player identity
	claimedBy: many(playerProfiles),
}));
export const playerProfilesRelations = relations(playerProfiles, ({ one, many }) => ({
	organization: one(organizations, {
		fields: [playerProfiles.organizationId],
		references: [organizations.id],
	}),
	claimedPlayer: one(players, {
		fields: [playerProfiles.claimedPlayerId],
		references: [players.id],
	}),
	registrations: many(playerRegistrations),
	seasonStats: many(playerSeasonStats),
	events: many(matchEvents),
}));

export const usersRelations = relations(users, ({ one }) => ({
	organization: one(organizations, {
		fields: [users.organizationId],
		references: [organizations.id],
	}),
}));

export const leaguesRelations = relations(leagues, ({ one, many }) => ({
	organization: one(organizations, {
		fields: [leagues.organizationId],
		references: [organizations.id],
	}),
	teams: many(teams),
	matches: many(matches),
	registrations: many(playerRegistrations),
	leagueMembers: many(leagueMembers),
}));

export const teamsRelations = relations(teams, ({ one, many }) => ({
	league: one(leagues, { fields: [teams.leagueId], references: [leagues.id] }),
	registrations: many(playerRegistrations),
	inscriptions: many(inscriptions),
	homeMatches: many(matches, { relationName: "homeTeam" }),
	awayMatches: many(matches, { relationName: "awayTeam" }),
	events: many(matchEvents),
}));

export const playerRegistrationsRelations = relations(playerRegistrations, ({ one }) => ({
	playerProfile: one(playerProfiles, {
		fields: [playerRegistrations.playerProfileId],
		references: [playerProfiles.id],
	}),
	// Legacy relation — kept during Historia 02 transition
	legacyPlayer: one(players, {
		fields: [playerRegistrations.legacyPlayerId],
		references: [players.id],
	}),
	team: one(teams, {
		fields: [playerRegistrations.teamId],
		references: [teams.id],
	}),
	league: one(leagues, {
		fields: [playerRegistrations.leagueId],
		references: [leagues.id],
	}),
}));

export const matchesRelations = relations(matches, ({ one, many }) => ({
	league: one(leagues, {
		fields: [matches.leagueId],
		references: [leagues.id],
	}),
	homeTeam: one(teams, {
		fields: [matches.homeTeamId],
		references: [teams.id],
		relationName: "homeTeam",
	}),
	awayTeam: one(teams, {
		fields: [matches.awayTeamId],
		references: [teams.id],
		relationName: "awayTeam",
	}),
	events: many(matchEvents),
}));

export const matchEventsRelations = relations(matchEvents, ({ one }) => ({
	match: one(matches, {
		fields: [matchEvents.matchId],
		references: [matches.id],
	}),
	playerProfile: one(playerProfiles, {
		fields: [matchEvents.playerProfileId],
		references: [playerProfiles.id],
	}),
	// Legacy relation — kept during Historia 02 transition
	legacyPlayer: one(players, {
		fields: [matchEvents.legacyPlayerId],
		references: [players.id],
	}),
	team: one(teams, { fields: [matchEvents.teamId], references: [teams.id] }),
}));

// ---------------------------------------------------------------------------
// TIPOS inferidos
// ---------------------------------------------------------------------------
export type Player = typeof players.$inferSelect;
export type NewPlayer = typeof players.$inferInsert;
// GlobalPlayer types exported above near table definition (GlobalPlayer, NewGlobalPlayer)
export type League = typeof leagues.$inferSelect;
export type NewLeague = typeof leagues.$inferInsert;
// Organization types are exported above near the table definition
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
		// FK nuevo ecosistema admin (Breaking Change)
		globalPlayerId: uuid("global_player_id").references(() => globalPlayers.id, {
			onDelete: "set null",
		}),
		leagueMemberId: uuid("league_member_id").references(() => leagueMembers.id, {
			onDelete: "set null",
		}),
		// @deprecated — capa local Historia 02, mantener durante transición
		playerProfileId: uuid("player_profile_id").references(() => playerProfiles.id, {
			onDelete: "cascade",
		}),
		// @deprecated — FK original legacy
		legacyPlayerId: uuid("legacy_player_id").references(() => players.id, {
			onDelete: "set null",
		}),
		leagueId: uuid("league_id")
			.notNull()
			.references(() => leagues.id, { onDelete: "cascade" }),
		teamId: uuid("team_id").references(() => teams.id, {
			onDelete: "set null",
		}),
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
		unique("unique_profile_season").on(t.playerProfileId, t.leagueId),
		index("pss_global_player_idx").on(t.globalPlayerId),
		index("pss_league_member_idx").on(t.leagueMemberId),
		index("pss_profile_idx").on(t.playerProfileId),
		index("pss_legacy_player_idx").on(t.legacyPlayerId),
		index("pss_league_idx").on(t.leagueId),
	],
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
	],
);

// Relations para las nuevas tablas
export const playerSeasonStatsRelations = relations(playerSeasonStats, ({ one }) => ({
	playerProfile: one(playerProfiles, {
		fields: [playerSeasonStats.playerProfileId],
		references: [playerProfiles.id],
	}),
	// Legacy relation — kept during Historia 02 transition
	legacyPlayer: one(players, {
		fields: [playerSeasonStats.legacyPlayerId],
		references: [players.id],
	}),
	league: one(leagues, {
		fields: [playerSeasonStats.leagueId],
		references: [leagues.id],
	}),
	team: one(teams, {
		fields: [playerSeasonStats.teamId],
		references: [teams.id],
	}),
}));

export const teamStandingsSnapshotRelations = relations(teamStandingsSnapshot, ({ one }) => ({
	team: one(teams, {
		fields: [teamStandingsSnapshot.teamId],
		references: [teams.id],
	}),
	league: one(leagues, {
		fields: [teamStandingsSnapshot.leagueId],
		references: [leagues.id],
	}),
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
	name: text("name").notNull(), // "Formato Goleadores Liga Lunes"
	type: text("type").notNull(), // "goleadores" | "standings"
	headerRow: integer("header_row").notNull().default(0), // índice de fila con encabezados (0-based)
	columnMap: text("column_map").notNull(), // JSON: { rawName: "B", goals: "D", ... }
	createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type ImportTemplate = typeof importTemplates.$inferSelect;
export type NewImportTemplate = typeof importTemplates.$inferInsert;

// ColumnMap tipado — mapa de campo → letra de columna o nombre de encabezado
export type GoleadoresColumnMap = {
	rawName: string; // columna del nombre del jugador
	teamName?: string; // columna del equipo
	goals: string; // columna de goles
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
// PLAYER_SEASON_STATS_SNAPSHOT — Historial de goleadores por jornada
//
// Diseño: stats ACUMULADAS hasta esa jornada (igual que player_season_stats).
// El delta entre jornadas se calcula en queries: J_N.goals − J_{N-1}.goals
// Esto permite corregir re-importaciones sin romper el historial.
//
// UNIQUE (player_id, league_id, jornada) — una fila por jugador × liga × jornada
// ---------------------------------------------------------------------------
export const playerSeasonStatsSnapshot = pgTable(
	"player_season_stats_snapshot",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		// FK nuevo ecosistema admin (Breaking Change)
		globalPlayerId: uuid("global_player_id").references(() => globalPlayers.id, {
			onDelete: "set null",
		}),
		// @deprecated — Pipeline legacy
		playerId: uuid("player_id").references(() => players.id, { onDelete: "set null" }),
		// @deprecated — Pipeline Historia 03
		playerProfileId: uuid("player_profile_id").references(() => playerProfiles.id, {
			onDelete: "set null",
		}),
		leagueId: uuid("league_id")
			.notNull()
			.references(() => leagues.id, { onDelete: "cascade" }),
		teamId: uuid("team_id").references(() => teams.id, {
			onDelete: "set null",
		}),
		jornada: integer("jornada").notNull(),
		goals: integer("goals").notNull().default(0),
		assists: integer("assists").notNull().default(0),
		yellowCards: integer("yellow_cards").notNull().default(0),
		redCards: integer("red_cards").notNull().default(0),
		matchesPlayed: integer("matches_played").notNull().default(0),
		importedAt: timestamp("imported_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(t) => [
		// Unique por pipeline legacy
		unique("unique_player_league_jornada_snap").on(t.playerId, t.leagueId, t.jornada),
		// Unique por pipeline nuevo
		unique("unique_profile_league_jornada_snap").on(t.playerProfileId, t.leagueId, t.jornada),
		index("psss_global_player_idx").on(t.globalPlayerId),
		index("psss_player_idx").on(t.playerId),
		index("psss_profile_idx").on(t.playerProfileId),
		index("psss_league_idx").on(t.leagueId),
		index("psss_jornada_idx").on(t.jornada),
	],
);

export const playerSeasonStatsSnapshotRelations = relations(
	playerSeasonStatsSnapshot,
	({ one }) => ({
		// Pipeline legacy
		player: one(players, {
			fields: [playerSeasonStatsSnapshot.playerId],
			references: [players.id],
		}),
		// Pipeline nuevo
		playerProfile: one(playerProfiles, {
			fields: [playerSeasonStatsSnapshot.playerProfileId],
			references: [playerProfiles.id],
		}),
		league: one(leagues, {
			fields: [playerSeasonStatsSnapshot.leagueId],
			references: [leagues.id],
		}),
		team: one(teams, {
			fields: [playerSeasonStatsSnapshot.teamId],
			references: [teams.id],
		}),
	}),
);

export type PlayerSeasonStatsSnapshot = typeof playerSeasonStatsSnapshot.$inferSelect;
export type NewPlayerSeasonStatsSnapshot = typeof playerSeasonStatsSnapshot.$inferInsert;

// ---------------------------------------------------------------------------
// PAGE_VIEWS — Contador de visitas únicas a las páginas públicas
// visitor_id: UUID persistido en cookie (1 año) para identificar al navegador
// ---------------------------------------------------------------------------
export const pageViews = pgTable(
	"page_views",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		visitorId: uuid("visitor_id").notNull(),
		page: text("page").notNull(), // pathname: "/", "/jugadores", "/jugador/[id]", "/analisis"
		visitedAt: timestamp("visited_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(t) => [
		index("pv_visitor_idx").on(t.visitorId),
		index("pv_page_idx").on(t.page),
		index("pv_visited_at_idx").on(t.visitedAt),
	],
);

export type PageView = typeof pageViews.$inferSelect;

// ---------------------------------------------------------------------------
// IMPORT_AUDIT_LOG — Registro de cada importación realizada
// Permite auditar qué se importó, cuándo, por quién, y si hubo anomalías.
// ---------------------------------------------------------------------------
export const importAuditLog = pgTable(
	"import_audit_log",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		leagueId: uuid("league_id")
			.notNull()
			.references(() => leagues.id, { onDelete: "cascade" }),
		importedBy: uuid("imported_by").references(() => users.id, {
			onDelete: "set null",
		}),
		importType: text("import_type").notNull(), // "goleadores" | "standings" | "events"
		jornada: integer("jornada"),
		rowsProcessed: integer("rows_processed").notNull().default(0),
		rowsCreated: integer("rows_created").notNull().default(0),
		anomalySummary: jsonb("anomaly_summary"), // AnomalyReport[] serializado
		warnings: text("warnings").array(),
		importedAt: timestamp("imported_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(t) => [
		index("ial_league_idx").on(t.leagueId),
		index("ial_imported_at_idx").on(t.importedAt),
		index("ial_jornada_idx").on(t.leagueId, t.jornada),
	],
);

export const importAuditLogRelations = relations(importAuditLog, ({ one }) => ({
	league: one(leagues, {
		fields: [importAuditLog.leagueId],
		references: [leagues.id],
	}),
	importedBy: one(users, {
		fields: [importAuditLog.importedBy],
		references: [users.id],
	}),
}));

export type ImportAuditLog = typeof importAuditLog.$inferSelect;
export type NewImportAuditLog = typeof importAuditLog.$inferInsert;

export const EVENT_TYPES = [
	"goal",
	"assist",
	"yellow_card",
	"red_card",
	"own_goal",
	"mvp",
] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export const MATCH_STATUSES = ["scheduled", "completed", "cancelled"] as const;
export type MatchStatus = (typeof MATCH_STATUSES)[number];

export const DAYS_OF_WEEK = [
	"lunes",
	"martes",
	"miercoles",
	"jueves",
	"viernes",
	"sabado",
	"domingo",
] as const;
export type DayOfWeek = (typeof DAYS_OF_WEEK)[number];

// ---------------------------------------------------------------------------
// PLAYER_GLOBAL_STATS — Vista agregada cross-org (Historia 05)
//
// Agrega estadísticas de un jugador a través de todos sus player_profiles
// con claim_status = 'verified'. Profiles unclaimed / proposed / rejected
// quedan EXCLUIDOS — garantía de privacidad cross-org.
//
// Vista REGULAR (no materializada) para MVP.
// Deuda técnica: migrar a MATERIALIZED VIEW si el costo de query sube.
// ---------------------------------------------------------------------------
export const playerGlobalStats = pgView("player_global_stats").as((qb) =>
	qb
		.select({
			playerId: players.id,
			fullName: players.fullName,
			alias: players.alias,
			organizationsCount:
				drizzleSql<number>`COUNT(DISTINCT ${playerProfiles.organizationId})::int`.as(
					"organizations_count",
				),
			leaguesCount: drizzleSql<number>`COUNT(DISTINCT ${playerRegistrations.leagueId})::int`.as(
				"leagues_count",
			),
			totalGoals: drizzleSql<number>`COALESCE(SUM(${playerSeasonStats.goals}), 0)::int`.as(
				"total_goals",
			),
			totalAssists: drizzleSql<number>`COALESCE(SUM(${playerSeasonStats.assists}), 0)::int`.as(
				"total_assists",
			),
			totalMatchesPlayed:
				drizzleSql<number>`COALESCE(SUM(${playerSeasonStats.matchesPlayed}), 0)::int`.as(
					"total_matches_played",
				),
			totalYellowCards:
				drizzleSql<number>`COALESCE(SUM(${playerSeasonStats.yellowCards}), 0)::int`.as(
					"total_yellow_cards",
				),
			totalRedCards: drizzleSql<number>`COALESCE(SUM(${playerSeasonStats.redCards}), 0)::int`.as(
				"total_red_cards",
			),
			lastUpdatedAt: drizzleSql<Date | null>`MAX(${playerSeasonStats.updatedAt})`.as(
				"last_updated_at",
			),
		})
		.from(players)
		.innerJoin(
			playerProfiles,
			drizzleSql`${playerProfiles.claimedPlayerId} = ${players.id} AND ${playerProfiles.claimStatus} = 'verified'`,
		)
		.leftJoin(
			playerRegistrations,
			drizzleSql`${playerRegistrations.playerProfileId} = ${playerProfiles.id}`,
		)
		.leftJoin(
			playerSeasonStats,
			drizzleSql`${playerSeasonStats.playerProfileId} = ${playerProfiles.id}`,
		)
		.groupBy(players.id, players.fullName, players.alias),
);

export type PlayerGlobalStatsRow = typeof playerGlobalStats.$inferSelect;
