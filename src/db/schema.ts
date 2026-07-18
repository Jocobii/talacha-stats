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
	uniqueIndex,
	index,
	jsonb,
	check,
	numeric,
} from "drizzle-orm/pg-core";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
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
// ORGANIZATION THEMES — Identidad visual por organización (docs/ORG-THEMING.md)
// 1:1 con organizations. Se persisten SOLO los 4 colores base (o el preset id);
// todo lo derivado (tints, tintas, líneas) lo calcula buildThemeTokens en
// shared/org-theme — así CSS y Satori nunca divergen.
// El catálogo de presets/fuentes vive en CÓDIGO (shared/org-theme); la DB solo
// guarda ids, igual que skin_activations valida contra SKIN_IDS.
// ---------------------------------------------------------------------------
export const organizationThemes = pgTable(
	"organization_themes",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		organizationId: uuid("organization_id")
			.notNull()
			.unique() // 1:1 — una org, un tema
			.references(() => organizations.id, { onDelete: "cascade" }),

		// "preset" → presetId apunta al catálogo en código (isOrgPresetId)
		// "custom" → los 4 hex de abajo son la fuente de verdad
		mode: text("mode").notNull().default("preset"), // "preset" | "custom"
		presetId: text("preset_id"),

		// Solo mode="custom". Formato #rrggbb — validado por Zod Y por CHECK.
		colorPrimary: text("color_primary"),
		colorAccent: text("color_accent"),
		colorSurface: text("color_surface"),
		colorInk: text("color_ink"),

		// Catálogo cerrado en código (shared/org-theme/fonts.ts, isOrgFontId)
		fontId: text("font_id").notNull().default("brand"),

		updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(t) => [
		check("chk_org_theme_mode", drizzleSql`${t.mode} IN ('preset','custom')`),
		// mode="preset" exige preset_id; mode="custom" exige los 4 colores
		check(
			"chk_org_theme_preset_complete",
			drizzleSql`${t.mode} <> 'preset' OR ${t.presetId} IS NOT NULL`,
		),
		check(
			"chk_org_theme_custom_complete",
			drizzleSql`${t.mode} <> 'custom' OR (${t.colorPrimary} IS NOT NULL AND ${t.colorAccent} IS NOT NULL AND ${t.colorSurface} IS NOT NULL AND ${t.colorInk} IS NOT NULL)`,
		),
		// Formato hex estricto (null permitido — lo exige el CHECK de arriba)
		check(
			"chk_org_theme_hex_format",
			drizzleSql`(${t.colorPrimary} IS NULL OR ${t.colorPrimary} ~* '^#[0-9a-f]{6}$') AND (${t.colorAccent} IS NULL OR ${t.colorAccent} ~* '^#[0-9a-f]{6}$') AND (${t.colorSurface} IS NULL OR ${t.colorSurface} ~* '^#[0-9a-f]{6}$') AND (${t.colorInk} IS NULL OR ${t.colorInk} ~* '^#[0-9a-f]{6}$')`,
		),
	],
);

export type OrganizationTheme = typeof organizationThemes.$inferSelect;
export type NewOrganizationTheme = typeof organizationThemes.$inferInsert;
export const ORG_THEME_MODES = ["preset", "custom"] as const;
export type OrgThemeMode = (typeof ORG_THEME_MODES)[number];

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
// Género del jugador — opcional, nunca bloquea el registro de jugadores
// migrados/legacy (columna nullable). Capturado en el alta manual (NewPlayerCard).
export const GENDER_OPTIONS = ["masculino", "femenino", "otro"] as const;
export type Gender = (typeof GENDER_OPTIONS)[number];

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
		gender: text("gender").$type<Gender | null>(),
		avatarUrl: text("avatar_url"),
		// Organización que dio de alta al jugador (Camino E — registro sin liga,
		// ver features/admin-registration/register.ts). Sin esto, un jugador
		// registrado sin liga no tiene ningún vínculo con ninguna organización
		// (global_players no se relaciona con leagues salvo vía league_members) y
		// quedaba invisible en /admin/players para siempre. Solo se usa como
		// fallback quando el jugador no tiene league_members — ver listOrgPlayers.
		// set null al borrar la organización: el jugador global sigue existiendo
		// (es identidad de plataforma, §14 AGENTS.md).
		registeredByOrganizationId: uuid("registered_by_organization_id").references(
			() => organizations.id,
			{ onDelete: "set null" },
		),
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(t) => [
		index("global_players_curp_idx").on(t.curpHash),
		index("global_players_name_canonical_idx").on(t.fullNameCanonical),
		check(
			"chk_global_player_gender",
			drizzleSql`${t.gender} IS NULL OR ${t.gender} IN ('masculino','femenino','otro')`,
		),
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
	// Módulo de sorteo opt-in por liga (Opción 2 — feature premium).
	// Si false, los endpoints de /scheduling/* retornan 400 y la UI no lo muestra.
	schedulingEnabled: boolean("scheduling_enabled").notNull().default(true),
	// Código corto de liga (3-8 letras) usado para prefijo de cédula: "LCN-0001"
	// Auto-generado desde el nombre, editable por el organizador.
	code: text("code"),
	createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// LEAGUE_PLAYOFF_ZONES — Zonas de clasificación configurables por liga
//
// Permite definir grupos de posiciones con nombre y color para mostrar
// en la tabla pública y de admin (Liguilla 1-8, Copa 9-16, Recopa 17-24…).
// Las zonas no se solapan — la lógica de validación se aplica en el API.
// color: "green" | "blue" | "amber" | "rose" | "purple" | "orange" | "cyan"
// ---------------------------------------------------------------------------
export const leaguePlayoffZones = pgTable(
	"league_playoff_zones",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		leagueId: uuid("league_id")
			.notNull()
			.references(() => leagues.id, { onDelete: "cascade" }),
		name: text("name").notNull(), // "Liguilla", "Copa", "Recopa", "Descenso"
		fromPosition: integer("from_position").notNull(), // 1-based, inclusive
		toPosition: integer("to_position").notNull(), // 1-based, inclusive
		color: text("color").notNull().default("green"), // Tailwind color key
		order: integer("order").notNull().default(0), // sorting order in config UI
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(t) => [index("league_playoff_zones_league_idx").on(t.leagueId)],
);

export type LeaguePlayoffZone = typeof leaguePlayoffZones.$inferSelect;
export type NewLeaguePlayoffZone = typeof leaguePlayoffZones.$inferInsert;

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
		// 'active' | 'disbanded' — disbanded teams are excluded from standings, sorteo, and new-season copy
		status: text("status").notNull().default("active"),
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
		// Datos de contacto — opcionales, capturados "por si hay una emergencia".
		// Data siloing igual que internalNotes: privados de cada liga, nunca cross-liga.
		phone: text("phone"), // teléfono del jugador
		residenceArea: text("residence_area"), // ciudad / colonia de residencia
		emergencyContactName: text("emergency_contact_name"), // ej. "madre, esposo — nombre"
		emergencyContactPhone: text("emergency_contact_phone"),
		medicalNotes: text("medical_notes"), // alergias, tipo de sangre, condición — opcional
		// Código de credencial — identificador humano corto, único por liga, usado
		// por el árbitro para ubicar al jugador en la lista de asistencia sin
		// depender del dorsal. Nullable durante migración; NOT NULL objetivo tras
		// backfill (ver docs/CREDENCIAL-CODIGO-JUGADOR.md). Se genera en el server
		// con assignNextCredential(); nunca lo propone el cliente. Inmutable.
		credentialCode: integer("credential_code"),
		// Qué pase (player_credentials) autoriza esta inscripción a la liga.
		// Nullable durante migración y para inscripciones sin pago aún
		// (pendiente de credencial). Ver docs/CREDENCIAL-PASE-JUGADOR.md.
		credentialId: uuid("credential_id").references((): AnyPgColumn => playerCredentials.id, {
			onDelete: "set null",
		}),
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(t) => [
		unique("uq_league_member").on(t.globalPlayerId, t.leagueId),
		unique("uq_league_member_credential").on(t.leagueId, t.credentialCode),
		index("league_members_global_player_idx").on(t.globalPlayerId),
		index("league_members_league_idx").on(t.leagueId),
		index("league_members_credential_idx").on(t.credentialId),
		check("chk_league_member_status", drizzleSql`${t.status} IN ('active','suspended','inactive')`),
		check(
			"chk_dorsal_range",
			drizzleSql`${t.dorsal} IS NULL OR (${t.dorsal} >= 1 AND ${t.dorsal} <= 99)`,
		),
		check(
			"chk_credential_code_positive",
			drizzleSql`${t.credentialCode} IS NULL OR ${t.credentialCode} >= 1`,
		),
	],
);

export type LeagueMember = typeof leagueMembers.$inferSelect;
export type NewLeagueMember = typeof leagueMembers.$inferInsert;

// ---------------------------------------------------------------------------
// PLAYER_CREDENTIALS — El pase: derecho a jugar (vigencia + alcance)
//
// No confundir con league_members.credential_code (etiqueta de asistencia).
// El pase vive colgado de global_players (identidad), no de la liga: un mismo
// jugador acumula pases a través del tiempo y entre organizaciones.
//
// scope = 'single_league' → cubre una sola liga mientras esté `active`
//   (leagues.status). No requiere valid_from/valid_until.
// scope = 'organization'  → cubre todas las ligas de la org durante un año
//   (valid_from → valid_until). leagueId es null.
//
// Ver docs/CREDENCIAL-PASE-JUGADOR.md para el diseño completo.
// ---------------------------------------------------------------------------
export const PLAYER_CREDENTIAL_SCOPES = ["single_league", "organization"] as const;
export type PlayerCredentialScope = (typeof PLAYER_CREDENTIAL_SCOPES)[number];

export const PLAYER_CREDENTIAL_STATUSES = ["active", "expired", "suspended", "cancelled"] as const;
export type PlayerCredentialStatus = (typeof PLAYER_CREDENTIAL_STATUSES)[number];

export const playerCredentials = pgTable(
	"player_credentials",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		globalPlayerId: uuid("global_player_id")
			.notNull()
			.references(() => globalPlayers.id, { onDelete: "cascade" }),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizations.id, { onDelete: "cascade" }),
		scope: text("scope").notNull().$type<PlayerCredentialScope>(),
		// Solo set cuando scope = 'single_league'. Null para el pase de organización.
		leagueId: uuid("league_id").references(() => leagues.id, { onDelete: "cascade" }),
		status: text("status").notNull().default("active").$type<PlayerCredentialStatus>(),
		validFrom: date("valid_from"), // requerido para 'organization'
		validUntil: date("valid_until"), // requerido para 'organization' (validFrom + 1 año)
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(t) => [
		index("player_credentials_global_player_idx").on(t.globalPlayerId),
		index("player_credentials_org_idx").on(t.organizationId),
		index("player_credentials_league_idx").on(t.leagueId),
		// Coherencia scope ↔ campos: desechable exige league_id; anual exige
		// org sin league_id y con vigencia completa.
		check(
			"chk_credential_scope_shape",
			drizzleSql`(
				(${t.scope} = 'single_league' AND ${t.leagueId} IS NOT NULL)
				OR
				(${t.scope} = 'organization'  AND ${t.leagueId} IS NULL
				 AND ${t.validFrom} IS NOT NULL AND ${t.validUntil} IS NOT NULL)
			)`,
		),
		check(
			"chk_credential_status",
			drizzleSql`${t.status} IN ('active','expired','suspended','cancelled')`,
		),
		check("chk_credential_scope_value", drizzleSql`${t.scope} IN ('single_league','organization')`),
		// Un solo pase de organización vigente por (jugador, org) — ver índice
		// parcial uq_org_credential_active en la migración SQL (Drizzle no
		// expresa nativo un UNIQUE INDEX ... WHERE).
	],
);

export type PlayerCredential = typeof playerCredentials.$inferSelect;
export type NewPlayerCredential = typeof playerCredentials.$inferInsert;

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
		// Valores: scheduled | played | suspended | walkover_home | walkover_away | postponed
		// legacy: completed | cancelled (mantenidos para retrocompatibilidad)
		status: text("status").notNull().default("scheduled"),
		// Nullable para partidos aún no capturados (scheduled)
		homeScore: integer("home_score"),
		awayScore: integer("away_score"),
		notes: text("notes"),
		// --- Módulo de sorteo (campos nuevos) ---
		// FK a matchdays.id. Nullable durante transición desde legacy.
		// El campo `matchday: integer` queda como @deprecated; leer desde matchdays.number.
		matchdayId: uuid("matchday_id").references(() => matchdays.id, { onDelete: "set null" }),
		venueId: uuid("venue_id").references(() => venues.id, { onDelete: "set null" }),
		// Fecha + hora exacta del partido (timezone de la organización).
		kickoffAt: timestamp("kickoff_at", { withTimezone: true }),
		// true = partido de recuperación generado por makeup-builder
		isMakeup: boolean("is_makeup").notNull().default(false),
		// --- Módulo de resolución de partidos ---
		// Identificador único por liga: "{LEAGUE_CODE}-{NNNN}" p.ej. "LCN-0001"
		cedula: text("cedula"),
		// Goles no atribuibles a jugador (ej: gol por llegada tardía del rival)
		homeBonusGoals: integer("home_bonus_goals").notNull().default(0),
		awayBonusGoals: integer("away_bonus_goals").notNull().default(0),
		refereeObservations: text("referee_observations"),
		resolvedAt: timestamp("resolved_at", { withTimezone: true }),
		resolvedBy: uuid("resolved_by").references(() => users.id, { onDelete: "set null" }),
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(t) => [
		index("matches_league_idx").on(t.leagueId),
		index("matches_date_idx").on(t.matchDate),
		index("matches_status_idx").on(t.status),
		index("matches_matchday_idx").on(t.matchdayId),
		index("matches_venue_idx").on(t.venueId),
		index("matches_kickoff_idx").on(t.kickoffAt),
		uniqueIndex("uniq_cedula_per_league").on(t.leagueId, t.cedula),
		index("idx_matches_cedula").on(t.cedula),
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
// MATCH_PLAYER_STATS — Estadísticas agregadas por jugador por partido
//
// Tabla creada para el módulo de Resolución de Partidos.
// Complementa match_events (event-stream individual) con un agregado editable
// por partido que el árbitro/oficinista captura directamente desde el papel.
//
// Fuente de verdad para el módulo de resolución; match_events sigue siendo
// la fuente legacy para stats importadas desde Excel o capturadas por evento.
// ---------------------------------------------------------------------------
export const matchPlayerStats = pgTable(
	"match_player_stats",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		matchId: uuid("match_id")
			.notNull()
			.references(() => matches.id, { onDelete: "cascade" }),
		// FK a inscriptions (jugador × equipo × liga — sistema nuevo)
		playerRegistrationId: uuid("player_registration_id")
			.notNull()
			.references(() => inscriptions.id, { onDelete: "cascade" }),
		// "home" | "away" — denormalizado para queries de rendimiento
		teamSide: text("team_side").notNull().$type<"home" | "away">(),
		isPresent: boolean("is_present").notNull().default(false),
		shirtNumber: integer("shirt_number"),
		goals: integer("goals").notNull().default(0),
		assists: integer("assists").notNull().default(0),
		yellowCards: integer("yellow_cards").notNull().default(0),
		blueCards: integer("blue_cards").notNull().default(0),
		redCards: integer("red_cards").notNull().default(0),
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(t) => [
		uniqueIndex("uniq_match_player").on(t.matchId, t.playerRegistrationId),
		index("idx_mps_match").on(t.matchId),
		index("idx_mps_registration").on(t.playerRegistrationId),
		check("chk_mps_team_side", drizzleSql`${t.teamSide} IN ('home','away')`),
	],
);

export type MatchPlayerStat = typeof matchPlayerStats.$inferSelect;
export type NewMatchPlayerStat = typeof matchPlayerStats.$inferInsert;

// ---------------------------------------------------------------------------
// RELATIONS (para queries con Drizzle relational API)
// ---------------------------------------------------------------------------
export const globalPlayersRelations = relations(globalPlayers, ({ one, many }) => ({
	leagueMembers: many(leagueMembers),
	suspensions: many(suspensions),
	credentials: many(playerCredentials),
	registeredByOrganization: one(organizations, {
		fields: [globalPlayers.registeredByOrganizationId],
		references: [organizations.id],
	}),
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
	credential: one(playerCredentials, {
		fields: [leagueMembers.credentialId],
		references: [playerCredentials.id],
	}),
	inscription: many(inscriptions),
}));

export const playerCredentialsRelations = relations(playerCredentials, ({ one, many }) => ({
	globalPlayer: one(globalPlayers, {
		fields: [playerCredentials.globalPlayerId],
		references: [globalPlayers.id],
	}),
	organization: one(organizations, {
		fields: [playerCredentials.organizationId],
		references: [organizations.id],
	}),
	league: one(leagues, {
		fields: [playerCredentials.leagueId],
		references: [leagues.id],
	}),
	leagueMembers: many(leagueMembers),
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

export const organizationsRelations = relations(organizations, ({ one, many }) => ({
	leagues: many(leagues),
	members: many(users),
	playerProfiles: many(playerProfiles),
	theme: one(organizationThemes, {
		fields: [organizations.id],
		references: [organizationThemes.organizationId],
	}),
	config: one(organizationConfig, {
		fields: [organizations.id],
		references: [organizationConfig.organizationId],
	}),
	schedulingConfig: one(organizationSchedulingConfig, {
		fields: [organizations.id],
		references: [organizationSchedulingConfig.organizationId],
	}),
}));

export const organizationThemesRelations = relations(organizationThemes, ({ one }) => ({
	organization: one(organizations, {
		fields: [organizationThemes.organizationId],
		references: [organizations.id],
	}),
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
	suspensions: many(suspensions),
	// Módulo de sorteo
	schedulingConfig: one(leagueSchedulingConfig, {
		fields: [leagues.id],
		references: [leagueSchedulingConfig.leagueId],
	}),
	// Reglamento del torneo (desempates, disciplina, refuerzos, finanzas)
	config: one(leagueConfig, {
		fields: [leagues.id],
		references: [leagueConfig.leagueId],
	}),
	leagueVenues: many(leagueVenues),
	matchdays: many(matchdays),
	restRequests: many(teamRestRequests),
	purchasedTimeslots: many(teamPurchasedTimeslots),
	playoffZones: many(leaguePlayoffZones),
	playoffBrackets: many(playoffBrackets),
}));

export const leaguePlayoffZonesRelations = relations(leaguePlayoffZones, ({ one }) => ({
	league: one(leagues, {
		fields: [leaguePlayoffZones.leagueId],
		references: [leagues.id],
	}),
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
	playerStats: many(matchPlayerStats),
	// Módulo de sorteo
	matchday: one(matchdays, {
		fields: [matches.matchdayId],
		references: [matchdays.id],
	}),
	venue: one(venues, {
		fields: [matches.venueId],
		references: [venues.id],
	}),
	makeupRecord: one(makeupMatches, {
		fields: [matches.id],
		references: [makeupMatches.matchId],
	}),
	overrides: many(matchScheduleOverrides),
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

export const matchPlayerStatsRelations = relations(matchPlayerStats, ({ one }) => ({
	match: one(matches, {
		fields: [matchPlayerStats.matchId],
		references: [matches.id],
	}),
	inscription: one(inscriptions, {
		fields: [matchPlayerStats.playerRegistrationId],
		references: [inscriptions.id],
	}),
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
// NARRATOR_ANALYSIS_EVENTS — Métrica de uso del módulo de análisis del narrador
// Una fila por análisis generado. Sirve para medir qué tan usado es el módulo
// (sobre todo el flujo Excel público) cuando salga a producción.
// ---------------------------------------------------------------------------
export const narratorAnalysisEvents = pgTable(
	"narrator_analysis_events",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		source: text("source").notNull(), // "excel" | "database"
		leagueName: text("league_name"), // nombre crudo (Excel no tiene league_id)
		teamAName: text("team_a_name").notNull(),
		teamBName: text("team_b_name").notNull(),
		visitorId: uuid("visitor_id"), // cookie del visitante, si existe
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(t) => [index("nae_source_idx").on(t.source), index("nae_created_at_idx").on(t.createdAt)],
);

export type NarratorAnalysisEvent = typeof narratorAnalysisEvents.$inferSelect;
export type NewNarratorAnalysisEvent = typeof narratorAnalysisEvents.$inferInsert;

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

// ===========================================================================
// MÓDULO DE SORTEO Y CALENDARIZACIÓN (opt-in por liga)
// Documentación: docs/scheduling-plan.md
// ===========================================================================

// ---------------------------------------------------------------------------
// VENUES — Canchas físicas disponibles para una organización
// ---------------------------------------------------------------------------
export const venues = pgTable(
	"venues",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		name: text("name").notNull(),
		// Generado con sanitizeToCanonical(). Usado para unicidad dentro de la org.
		nameCanonical: text("name_canonical").notNull(),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizations.id, { onDelete: "cascade" }),
		city: text("city"),
		address: text("address"),
		// Hex de identificación visible en cockpit, tarjetas y calendario (#RRGGBB).
		color: text("color").notNull().default("#60A5FA"),
		// Canchas paralelas disponibles (1–6). CHECK en migración 0025.
		capacity: integer("capacity").notNull().default(1),
		notes: text("notes"),
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(t) => [
		unique("uq_venues_org_canonical").on(t.organizationId, t.nameCanonical),
		index("venues_org_idx").on(t.organizationId),
	],
);

export type Venue = typeof venues.$inferSelect;
export type NewVenue = typeof venues.$inferInsert;

// ---------------------------------------------------------------------------
// LEAGUE_SCHEDULING_CONFIG — Parámetros de calendarización por liga (1:1)
// ---------------------------------------------------------------------------
export const leagueSchedulingConfig = pgTable("league_scheduling_config", {
	leagueId: uuid("league_id")
		.primaryKey()
		.references(() => leagues.id, { onDelete: "cascade" }),
	// Default: teamsCount - 1 (single round-robin). Editable.
	regularMatchdays: integer("regular_matchdays").notNull(),
	// "single" | "double" — MVP solo implementa "single"
	regularFormat: text("regular_format").notNull().default("single"),
	matchDurationMinutes: integer("match_duration_minutes").notNull().default(50),
	bufferMinutes: integer("buffer_minutes").notNull().default(0),
	// Si true, permite swaps manuales que generarían un par repetido en regular
	allowDuplicateMatchups: boolean("allow_duplicate_matchups").notNull().default(false),
	// Número de jornadas cerradas/publicadas hacia atrás en las que no se permite
	// repetir un enfrentamiento (S4 deslizante). Default: 3.
	noRepeatWithin: integer("no_repeat_within").notNull().default(3),
	// Seed del último sorteo generado. Mismo seed → mismo resultado.
	lastSeed: integer("last_seed"),
	updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type LeagueSchedulingConfig = typeof leagueSchedulingConfig.$inferSelect;
export type NewLeagueSchedulingConfig = typeof leagueSchedulingConfig.$inferInsert;

// ---------------------------------------------------------------------------
// LEAGUE_CONFIG — Reglamento del torneo (1:1). Home de la configurabilidad
// (desempates, disciplina, refuerzos, nivel financiero). Se congela al
// resolver la primera cédula (locked_at) — ver features/tournament-rules.
// ---------------------------------------------------------------------------
export const leagueConfig = pgTable("league_config", {
	leagueId: uuid("league_id")
		.primaryKey()
		.references(() => leagues.id, { onDelete: "cascade" }),
	pointsWin: integer("points_win").notNull().default(3),
	pointsDraw: integer("points_draw").notNull().default(1),
	// Orden de criterios de desempate. Default = comportamiento actual de
	// standings.ts + head-to-head como segundo criterio.
	tiebreakers: jsonb("tiebreakers")
		.$type<string[]>()
		.notNull()
		.default(drizzleSql`'["points","head_to_head","goal_diff","goals_for","name"]'::jsonb`),
	// Amarillas acumuladas que disparan 1 fecha de suspensión.
	yellowThreshold: integer("yellow_threshold").notNull().default(5),
	// Fechas de suspensión por roja directa.
	redCardMatches: integer("red_card_matches").notNull().default(1),
	// Significado de la tarjeta azul (no estándar entre ligas amateur):
	// 'temp' = expulsión temporal (5 min), 'yellow' = cuenta como amarilla, 'none' = no se usa.
	blueCardMeaning: text("blue_card_meaning")
		.$type<"temp" | "yellow" | "none">()
		.notNull()
		.default("temp"),
	// null = sin límite de refuerzos.
	reinforcementLimit: integer("reinforcement_limit"),
	// 0 = sin finanzas, 1 = liga formal, 2 = liga fuerte.
	financeLevel: integer("finance_level").notNull().default(0),
	// Se setea al resolver la primera cédula de la liga; después de eso,
	// la config es solo lectura salvo acción explícita del owner.
	lockedAt: timestamp("locked_at", { withTimezone: true }),
	updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type LeagueConfig = typeof leagueConfig.$inferSelect;
export type NewLeagueConfig = typeof leagueConfig.$inferInsert;

// ---------------------------------------------------------------------------
// ORGANIZATION_CONFIG — Default de reglamento por organización (§4.5 de
// docs/MODULOS-GESTION-LIGA.md). Se COPIA a league_config al crear una liga
// nueva — no hay herencia en vivo ni resolución org→liga en cada lectura.
// Nunca se congela (a diferencia de league_config): es solo una plantilla.
// ---------------------------------------------------------------------------
export const organizationConfig = pgTable("organization_config", {
	organizationId: uuid("organization_id")
		.primaryKey()
		.references(() => organizations.id, { onDelete: "cascade" }),
	pointsWin: integer("points_win").notNull().default(3),
	pointsDraw: integer("points_draw").notNull().default(1),
	tiebreakers: jsonb("tiebreakers")
		.$type<string[]>()
		.notNull()
		.default(drizzleSql`'["points","head_to_head","goal_diff","goals_for","name"]'::jsonb`),
	yellowThreshold: integer("yellow_threshold").notNull().default(5),
	redCardMatches: integer("red_card_matches").notNull().default(1),
	blueCardMeaning: text("blue_card_meaning")
		.$type<"temp" | "yellow" | "none">()
		.notNull()
		.default("temp"),
	reinforcementLimit: integer("reinforcement_limit"),
	financeLevel: integer("finance_level").notNull().default(0),
	updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type OrganizationConfig = typeof organizationConfig.$inferSelect;
export type NewOrganizationConfig = typeof organizationConfig.$inferInsert;

export const organizationConfigRelations = relations(organizationConfig, ({ one }) => ({
	organization: one(organizations, {
		fields: [organizationConfig.organizationId],
		references: [organizations.id],
	}),
}));

// ---------------------------------------------------------------------------
// ORGANIZATION_SCHEDULING_CONFIG — Default de parámetros de sorteo por
// organización (docs/ORG-PROFILE-HUB.md §3, Épica Q). Se COPIA a
// league_scheduling_config al crear una liga nueva — mismo principio
// copy-on-create que organization_config. Nunca se congela. Sin lastSeed
// (es estado de ejecución de un sorteo concreto, no una plantilla).
// ---------------------------------------------------------------------------
export const organizationSchedulingConfig = pgTable("organization_scheduling_config", {
	organizationId: uuid("organization_id")
		.primaryKey()
		.references(() => organizations.id, { onDelete: "cascade" }),
	// null = automático (teamsCount - 1 al crear la liga). Un número explícito
	// = "esta organización siempre juega N jornadas regulares" (docs §1 D-2).
	regularMatchdays: integer("regular_matchdays"),
	regularFormat: text("regular_format").notNull().default("single"),
	matchDurationMinutes: integer("match_duration_minutes").notNull().default(50),
	bufferMinutes: integer("buffer_minutes").notNull().default(0),
	allowDuplicateMatchups: boolean("allow_duplicate_matchups").notNull().default(false),
	noRepeatWithin: integer("no_repeat_within").notNull().default(3),
	updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type OrganizationSchedulingConfig = typeof organizationSchedulingConfig.$inferSelect;
export type NewOrganizationSchedulingConfig = typeof organizationSchedulingConfig.$inferInsert;

export const organizationSchedulingConfigRelations = relations(
	organizationSchedulingConfig,
	({ one }) => ({
		organization: one(organizations, {
			fields: [organizationSchedulingConfig.organizationId],
			references: [organizations.id],
		}),
	}),
);

// ---------------------------------------------------------------------------
// ORGANIZATION_CREDENTIAL_CONFIG — Qué modalidades de pase emite esta org
// (docs/CREDENCIAL-PASE-JUGADOR.md). Config singleton por organización, mismo
// patrón que organization_config / organization_scheduling_config.
//
// Si ambas están en true, el cliente debe elegir explícitamente el scope al
// emitir un pase (la UI muestra un modal); si solo una está en true, el
// server la infiere sin preguntar. Al menos una debe estar habilitada.
//
// Default de fábrica: solo el anual (organization) habilitado — el
// organizador activa "por liga" explícitamente si lo necesita (decisión de
// diseño, docs/CREDENCIAL-PASE-JUGADOR.md).
// ---------------------------------------------------------------------------
export const organizationCredentialConfig = pgTable(
	"organization_credential_config",
	{
		organizationId: uuid("organization_id")
			.primaryKey()
			.references(() => organizations.id, { onDelete: "cascade" }),
		allowSingleLeaguePass: boolean("allow_single_league_pass").notNull().default(false),
		allowOrganizationPass: boolean("allow_organization_pass").notNull().default(true),
		updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(t) => [
		check(
			"chk_credential_config_at_least_one",
			drizzleSql`${t.allowSingleLeaguePass} OR ${t.allowOrganizationPass}`,
		),
	],
);

export type OrganizationCredentialConfig = typeof organizationCredentialConfig.$inferSelect;
export type NewOrganizationCredentialConfig = typeof organizationCredentialConfig.$inferInsert;

export const organizationCredentialConfigRelations = relations(
	organizationCredentialConfig,
	({ one }) => ({
		organization: one(organizations, {
			fields: [organizationCredentialConfig.organizationId],
			references: [organizations.id],
		}),
	}),
);

// ---------------------------------------------------------------------------
// SUSPENSIONS — Disciplina (Épica B, §5.2 docs/MODULOS-GESTION-LIGA.md).
// Dos capas de duración: 'matches' (motor automático — amarillas acumuladas
// y roja directa, cuenta jornadas) y 'time'/'permanent' (escalado manual del
// organizador para casos graves — semanas, meses o veto indefinido). Motivado
// por SANCIONES.xlsx real de Jocobi (jul 2026): la roja directa no siempre es
// "1 fecha y ya".
// ---------------------------------------------------------------------------
export const SUSPENSION_REASONS = ["yellow_accumulation", "red_card", "manual"] as const;
export type SuspensionReason = (typeof SUSPENSION_REASONS)[number];

export const SUSPENSION_DURATION_TYPES = ["matches", "time", "permanent"] as const;
export type SuspensionDurationType = (typeof SUSPENSION_DURATION_TYPES)[number];

export const SUSPENSION_DURATION_UNITS = ["days", "weeks", "months"] as const;
export type SuspensionDurationUnit = (typeof SUSPENSION_DURATION_UNITS)[number];

export const SUSPENSION_STATUSES = ["active", "served", "lifted"] as const;
export type SuspensionStatus = (typeof SUSPENSION_STATUSES)[number];

export const suspensions = pgTable(
	"suspensions",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		globalPlayerId: uuid("global_player_id")
			.notNull()
			.references(() => globalPlayers.id, { onDelete: "cascade" }),
		leagueId: uuid("league_id")
			.notNull()
			.references(() => leagues.id, { onDelete: "cascade" }),
		reason: text("reason").notNull().$type<SuspensionReason>(),
		// Motivo libre (ej. "Amenazas al árbitro") — sin catálogo de cláusulas,
		// texto libre igual que SANCIONES.xlsx (decisión §2.1 doc).
		reasonDetail: text("reason_detail"),
		durationType: text("duration_type").notNull().$type<SuspensionDurationType>(),
		// duration_type = 'matches' (motor automático):
		matchesTotal: integer("matches_total"),
		matchesServed: integer("matches_served").notNull().default(0),
		// duration_type = 'time' (escalado manual — semanas/meses):
		durationValue: integer("duration_value"),
		durationUnit: text("duration_unit").$type<SuspensionDurationUnit>(),
		startsOn: date("starts_on"),
		endsOn: date("ends_on"), // calculado: starts_on + duration_value/unit
		// duration_type = 'permanent': sin campos de duración, solo status.
		status: text("status").notNull().default("active").$type<SuspensionStatus>(),
		sourceMatchId: uuid("source_match_id").references(() => matches.id, { onDelete: "set null" }),
		recordedBy: uuid("recorded_by").references(() => users.id, { onDelete: "set null" }),
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(t) => [
		index("suspensions_global_player_idx").on(t.globalPlayerId),
		index("suspensions_league_idx").on(t.leagueId),
		index("suspensions_status_idx").on(t.status),
		check(
			"chk_suspension_reason",
			drizzleSql`${t.reason} IN ('yellow_accumulation','red_card','manual')`,
		),
		check(
			"chk_suspension_duration_type",
			drizzleSql`${t.durationType} IN ('matches','time','permanent')`,
		),
		check(
			"chk_suspension_duration_unit",
			drizzleSql`${t.durationUnit} IS NULL OR ${t.durationUnit} IN ('days','weeks','months')`,
		),
		check("chk_suspension_status", drizzleSql`${t.status} IN ('active','served','lifted')`),
		// Coherencia por modo: 'matches' necesita matches_total; 'time' necesita
		// duration_value+unit+starts_on; 'permanent' no lleva campos de duración.
		check(
			"chk_suspension_duration_fields",
			drizzleSql`
				(${t.durationType} = 'matches' AND ${t.matchesTotal} IS NOT NULL)
				OR (${t.durationType} = 'time' AND ${t.durationValue} IS NOT NULL AND ${t.durationUnit} IS NOT NULL AND ${t.startsOn} IS NOT NULL)
				OR (${t.durationType} = 'permanent')
			`,
		),
	],
);

export type Suspension = typeof suspensions.$inferSelect;
export type NewSuspension = typeof suspensions.$inferInsert;

export const suspensionsRelations = relations(suspensions, ({ one }) => ({
	globalPlayer: one(globalPlayers, {
		fields: [suspensions.globalPlayerId],
		references: [globalPlayers.id],
	}),
	league: one(leagues, {
		fields: [suspensions.leagueId],
		references: [leagues.id],
	}),
	sourceMatch: one(matches, {
		fields: [suspensions.sourceMatchId],
		references: [matches.id],
	}),
	recordedByUser: one(users, {
		fields: [suspensions.recordedBy],
		references: [users.id],
	}),
}));

// ---------------------------------------------------------------------------
// LEAGUE_VENUES — Pivote: qué canchas usa una liga y con qué prioridad
// ---------------------------------------------------------------------------
export const leagueVenues = pgTable(
	"league_venues",
	{
		leagueId: uuid("league_id")
			.notNull()
			.references(() => leagues.id, { onDelete: "cascade" }),
		venueId: uuid("venue_id")
			.notNull()
			.references(() => venues.id, { onDelete: "cascade" }),
		// Menor número = el slot assigner la llena primero
		priority: integer("priority").notNull().default(1),
	},
	(t) => [unique("uq_league_venue").on(t.leagueId, t.venueId)],
);

export type LeagueVenue = typeof leagueVenues.$inferSelect;
export type NewLeagueVenue = typeof leagueVenues.$inferInsert;

// ---------------------------------------------------------------------------
// VENUE_TIME_WINDOWS — Banda horaria de una cancha para una liga
// Permite múltiples ventanas por cancha/día (ej. mañana y noche).
// ---------------------------------------------------------------------------
export const venueTimeWindows = pgTable(
	"venue_time_windows",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		leagueId: uuid("league_id")
			.notNull()
			.references(() => leagues.id, { onDelete: "cascade" }),
		venueId: uuid("venue_id")
			.notNull()
			.references(() => venues.id, { onDelete: "cascade" }),
		dayOfWeek: text("day_of_week").notNull(), // "lunes" | "martes" | ...
		startTime: text("start_time").notNull(), // "19:40"
		endTime: text("end_time").notNull(), // "22:10"
		isActive: boolean("is_active").notNull().default(true),
	},
	(t) => [index("vtw_league_idx").on(t.leagueId), index("vtw_venue_idx").on(t.venueId)],
);

export type VenueTimeWindow = typeof venueTimeWindows.$inferSelect;
export type NewVenueTimeWindow = typeof venueTimeWindows.$inferInsert;

// ---------------------------------------------------------------------------
// MATCHDAYS — Jornada explícita de una liga
// ---------------------------------------------------------------------------
export const matchdays = pgTable(
	"matchdays",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		leagueId: uuid("league_id")
			.notNull()
			.references(() => leagues.id, { onDelete: "cascade" }),
		number: integer("number").notNull(),
		phase: text("phase").notNull().default("regular"), // "regular" | "playoff"
		scheduledDate: date("scheduled_date").notNull(),
		status: text("status").notNull().default("draft"), // "draft" | "published" | "in_progress" | "completed"
		notes: text("notes"),
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(t) => [
		unique("uq_matchday_league_number").on(t.leagueId, t.number),
		index("matchdays_league_idx").on(t.leagueId),
		check("chk_matchday_phase", drizzleSql`${t.phase} IN ('regular','playoff')`),
		check(
			"chk_matchday_status",
			drizzleSql`${t.status} IN ('draft','published','in_progress','completed')`,
		),
	],
);

export type Matchday = typeof matchdays.$inferSelect;
export type NewMatchday = typeof matchdays.$inferInsert;

// ---------------------------------------------------------------------------
// TEAM_REST_REQUESTS — Equipos que solicitan descanso en una jornada (S3)
// ---------------------------------------------------------------------------
export const teamRestRequests = pgTable(
	"team_rest_requests",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		teamId: uuid("team_id")
			.notNull()
			.references(() => teams.id, { onDelete: "cascade" }),
		leagueId: uuid("league_id")
			.notNull()
			.references(() => leagues.id, { onDelete: "cascade" }),
		matchdayNumber: integer("matchday_number").notNull(),
		reason: text("reason"),
		requestedAt: timestamp("requested_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(t) => [
		unique("uq_team_rest").on(t.teamId, t.leagueId, t.matchdayNumber),
		index("trr_league_matchday_idx").on(t.leagueId, t.matchdayNumber),
	],
);

export type TeamRestRequest = typeof teamRestRequests.$inferSelect;
export type NewTeamRestRequest = typeof teamRestRequests.$inferInsert;

// ---------------------------------------------------------------------------
// TEAM_PURCHASED_TIMESLOTS — Horario comprado por equipo para la temporada (S7)
// Hard constraint para el slot assigner.
// ---------------------------------------------------------------------------
export const teamPurchasedTimeslots = pgTable(
	"team_purchased_timeslots",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		teamId: uuid("team_id")
			.notNull()
			.references(() => teams.id, { onDelete: "cascade" }),
		leagueId: uuid("league_id")
			.notNull()
			.references(() => leagues.id, { onDelete: "cascade" }),
		startTime: text("start_time").notNull(), // "18:50" — hora local de la org
		// Si compró cancha específica; null = cualquier cancha activa
		venueId: uuid("venue_id").references(() => venues.id, { onDelete: "set null" }),
		activeFromDate: date("active_from_date").notNull(),
		// null = vigente toda la temporada
		endMatchdayNumber: integer("end_matchday_number"),
		notes: text("notes"),
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(t) => [
		unique("uq_team_purchased").on(t.teamId, t.leagueId),
		index("tpt_team_idx").on(t.teamId),
		index("tpt_league_idx").on(t.leagueId),
	],
);

export type TeamPurchasedTimeslot = typeof teamPurchasedTimeslots.$inferSelect;
export type NewTeamPurchasedTimeslot = typeof teamPurchasedTimeslots.$inferInsert;

// ---------------------------------------------------------------------------
// MAKEUP_MATCHES — Tracking de partidos de recuperación para equipos late (S2)
// ---------------------------------------------------------------------------
export const makeupMatches = pgTable(
	"makeup_matches",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		matchId: uuid("match_id")
			.notNull()
			.references(() => matches.id, { onDelete: "cascade" }),
		teamId: uuid("team_id")
			.notNull()
			.references(() => teams.id, { onDelete: "cascade" }),
		originalMatchdayNumber: integer("original_matchday_number"),
		reason: text("reason"),
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(t) => [index("mm_team_idx").on(t.teamId), index("mm_match_idx").on(t.matchId)],
);

export type MakeupMatch = typeof makeupMatches.$inferSelect;
export type NewMakeupMatch = typeof makeupMatches.$inferInsert;

// ---------------------------------------------------------------------------
// MATCH_SCHEDULE_OVERRIDES — Audit log de cambios manuales sobre partidos (S6)
// No es tabla de estado; es de historia. El estado vive en `matches`.
// ---------------------------------------------------------------------------
export const matchScheduleOverrides = pgTable(
	"match_schedule_overrides",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		matchId: uuid("match_id")
			.notNull()
			.references(() => matches.id, { onDelete: "cascade" }),
		changedBy: uuid("changed_by").references(() => users.id, { onDelete: "set null" }),
		// "time" | "venue" | "team_swap" | "matchday"
		changeType: text("change_type").notNull(),
		previousValue: jsonb("previous_value").notNull(), // snapshot del estado anterior
		newValue: jsonb("new_value").notNull(),
		reason: text("reason"),
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(t) => [index("mso_match_idx").on(t.matchId), index("mso_changed_by_idx").on(t.changedBy)],
);

export type MatchScheduleOverride = typeof matchScheduleOverrides.$inferSelect;
export type NewMatchScheduleOverride = typeof matchScheduleOverrides.$inferInsert;

// ---------------------------------------------------------------------------
// VENUE_RENTALS — Rentas directas de canchas (fuera de torneos)
// Gestiona el uso comercial de la cancha en huecos entre torneos.
// ---------------------------------------------------------------------------
export const RENTAL_STATUSES = ["confirmed", "tentative", "cancelled"] as const;
export type RentalStatus = (typeof RENTAL_STATUSES)[number];

export const venueRentals = pgTable(
	"venue_rentals",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		venueId: uuid("venue_id")
			.notNull()
			.references(() => venues.id, { onDelete: "cascade" }),
		// Nombre del cliente o descripción del evento
		title: text("title").notNull(),
		startAt: timestamp("start_at", { withTimezone: true }).notNull(),
		endAt: timestamp("end_at", { withTimezone: true }).notNull(),
		// Precio en MXN; null = no definido
		price: numeric("price", { precision: 10, scale: 2 }),
		status: text("status").notNull().default("confirmed").$type<RentalStatus>(),
		notes: text("notes"),
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(t) => [
		index("vr_venue_idx").on(t.venueId),
		index("vr_start_at_idx").on(t.startAt),
		index("vr_status_idx").on(t.status),
		check("chk_rental_status", drizzleSql`${t.status} IN ('confirmed','tentative','cancelled')`),
		check("chk_rental_dates", drizzleSql`${t.endAt} > ${t.startAt}`),
	],
);

export type VenueRental = typeof venueRentals.$inferSelect;
export type NewVenueRental = typeof venueRentals.$inferInsert;

// ---------------------------------------------------------------------------
// RELATIONS — Módulo de sorteo
// ---------------------------------------------------------------------------
export const venuesRelations = relations(venues, ({ one, many }) => ({
	organization: one(organizations, {
		fields: [venues.organizationId],
		references: [organizations.id],
	}),
	leagueVenues: many(leagueVenues),
	timeWindows: many(venueTimeWindows),
	purchasedSlots: many(teamPurchasedTimeslots),
	rentals: many(venueRentals),
}));

export const venueRentalsRelations = relations(venueRentals, ({ one }) => ({
	venue: one(venues, {
		fields: [venueRentals.venueId],
		references: [venues.id],
	}),
}));

export const leagueSchedulingConfigRelations = relations(leagueSchedulingConfig, ({ one }) => ({
	league: one(leagues, {
		fields: [leagueSchedulingConfig.leagueId],
		references: [leagues.id],
	}),
}));

export const leagueConfigRelations = relations(leagueConfig, ({ one }) => ({
	league: one(leagues, {
		fields: [leagueConfig.leagueId],
		references: [leagues.id],
	}),
}));

export const leagueVenuesRelations = relations(leagueVenues, ({ one }) => ({
	league: one(leagues, { fields: [leagueVenues.leagueId], references: [leagues.id] }),
	venue: one(venues, { fields: [leagueVenues.venueId], references: [venues.id] }),
}));

export const venueTimeWindowsRelations = relations(venueTimeWindows, ({ one }) => ({
	league: one(leagues, { fields: [venueTimeWindows.leagueId], references: [leagues.id] }),
	venue: one(venues, { fields: [venueTimeWindows.venueId], references: [venues.id] }),
}));

export const matchdaysRelations = relations(matchdays, ({ one, many }) => ({
	league: one(leagues, { fields: [matchdays.leagueId], references: [leagues.id] }),
	matches: many(matches),
}));

export const teamRestRequestsRelations = relations(teamRestRequests, ({ one }) => ({
	team: one(teams, { fields: [teamRestRequests.teamId], references: [teams.id] }),
	league: one(leagues, { fields: [teamRestRequests.leagueId], references: [leagues.id] }),
}));

export const teamPurchasedTimeslotsRelations = relations(teamPurchasedTimeslots, ({ one }) => ({
	team: one(teams, { fields: [teamPurchasedTimeslots.teamId], references: [teams.id] }),
	league: one(leagues, { fields: [teamPurchasedTimeslots.leagueId], references: [leagues.id] }),
	venue: one(venues, { fields: [teamPurchasedTimeslots.venueId], references: [venues.id] }),
}));

export const makeupMatchesRelations = relations(makeupMatches, ({ one }) => ({
	match: one(matches, { fields: [makeupMatches.matchId], references: [matches.id] }),
	team: one(teams, { fields: [makeupMatches.teamId], references: [teams.id] }),
}));

export const matchScheduleOverridesRelations = relations(matchScheduleOverrides, ({ one }) => ({
	match: one(matches, { fields: [matchScheduleOverrides.matchId], references: [matches.id] }),
	changedBy: one(users, {
		fields: [matchScheduleOverrides.changedBy],
		references: [users.id],
	}),
}));

export const EVENT_TYPES = [
	"goal",
	"assist",
	"yellow_card",
	"red_card",
	"own_goal",
	"mvp",
] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export const MATCH_STATUSES = [
	"scheduled",
	"played",
	"suspended",
	"walkover_home",
	"walkover_away",
	"postponed",
	// legacy — mantenidos para retrocompatibilidad con datos existentes
	"completed",
	"cancelled",
] as const;
export type MatchStatus = (typeof MATCH_STATUSES)[number];

// Subset de statuses activos del módulo de resolución (excluye legacy)
export const RESOLUTION_STATUSES = [
	"scheduled",
	"played",
	"suspended",
	"walkover_home",
	"walkover_away",
	"postponed",
] as const;
export type ResolutionStatus = (typeof RESOLUTION_STATUSES)[number];

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
// PLAYOFF_BRACKETS — Un bracket por zona activa cuando se inicia la fase final.
// Se crean todos a la vez al presionar "Iniciar Fase Final".
// UNIQUE (leagueId, zoneId) — no puede haber dos brackets de la misma zona.
// ---------------------------------------------------------------------------
export const playoffBrackets = pgTable(
	"playoff_brackets",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		leagueId: uuid("league_id")
			.notNull()
			.references(() => leagues.id, { onDelete: "cascade" }),
		zoneId: uuid("zone_id")
			.notNull()
			.references(() => leaguePlayoffZones.id, { onDelete: "cascade" }),
		zoneName: text("zone_name").notNull(), // denormalized para no hacer join en display
		zoneColor: text("zone_color").notNull().default("green"), // denormalized
		status: text("status").notNull().default("active"), // "active" | "completed"
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(t) => [
		unique("uq_bracket_zone").on(t.leagueId, t.zoneId),
		index("playoff_brackets_league_idx").on(t.leagueId),
	],
);

export type PlayoffBracket = typeof playoffBrackets.$inferSelect;
export type NewPlayoffBracket = typeof playoffBrackets.$inferInsert;

// ---------------------------------------------------------------------------
// PLAYOFF_SLOTS — Las casillas del bracket. Generadas de golpe al crear el bracket.
//
// round:       1 = primera ronda (QF/SF según el tamaño), 2 = SF, 3 = Final/3er lugar
// slotIndex:   posición 0-based dentro del round
// isThirdPlace: distingue la Final del partido por 3er/4to lugar
// isBye:       true → el home_team avanza sin jugar (score automático)
//
// homeFromSlotId / awayFromSlotId: referencia al slot del round anterior
//   cuyo GANADOR o PERDEDOR se convierte en local/visitante.
// homeFromType / awayFromType: "winner" | "loser"
//   (el 3er lugar usa "loser", todos los demás usan "winner")
//
// matchId: FK a matches.id — null hasta que el admin arranca ese round.
// ---------------------------------------------------------------------------
export const playoffSlots = pgTable(
	"playoff_slots",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		bracketId: uuid("bracket_id")
			.notNull()
			.references(() => playoffBrackets.id, { onDelete: "cascade" }),
		round: integer("round").notNull(),
		slotIndex: integer("slot_index").notNull(),
		isThirdPlace: boolean("is_third_place").notNull().default(false),
		isBye: boolean("is_bye").notNull().default(false),
		// Equipos — nullable hasta que el round se genera
		homeTeamId: uuid("home_team_id").references(() => teams.id, { onDelete: "set null" }),
		awayTeamId: uuid("away_team_id").references(() => teams.id, { onDelete: "set null" }),
		// Propagación desde round anterior (self-reference)
		homeFromSlotId: uuid("home_from_slot_id").references((): AnyPgColumn => playoffSlots.id, {
			onDelete: "set null",
		}),
		homeFromType: text("home_from_type"), // "winner" | "loser"
		awayFromSlotId: uuid("away_from_slot_id").references((): AnyPgColumn => playoffSlots.id, {
			onDelete: "set null",
		}),
		awayFromType: text("away_from_type"), // "winner" | "loser"
		// Resultado (se rellena al capturar el partido)
		winnerId: uuid("winner_id").references(() => teams.id, { onDelete: "set null" }),
		loserId: uuid("loser_id").references(() => teams.id, { onDelete: "set null" }),
		// Partido real — null hasta que se crea
		matchId: uuid("match_id").references(() => matches.id, { onDelete: "set null" }),
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(t) => [
		index("playoff_slots_bracket_idx").on(t.bracketId),
		unique("uq_slot_bracket_round_index").on(t.bracketId, t.round, t.slotIndex),
	],
);

export type PlayoffSlot = typeof playoffSlots.$inferSelect;
export type NewPlayoffSlot = typeof playoffSlots.$inferInsert;

export const playoffBracketsRelations = relations(playoffBrackets, ({ one, many }) => ({
	league: one(leagues, { fields: [playoffBrackets.leagueId], references: [leagues.id] }),
	zone: one(leaguePlayoffZones, {
		fields: [playoffBrackets.zoneId],
		references: [leaguePlayoffZones.id],
	}),
	slots: many(playoffSlots),
}));

export const playoffSlotsRelations = relations(playoffSlots, ({ one }) => ({
	bracket: one(playoffBrackets, {
		fields: [playoffSlots.bracketId],
		references: [playoffBrackets.id],
	}),
	homeTeam: one(teams, {
		fields: [playoffSlots.homeTeamId],
		references: [teams.id],
		relationName: "slotHome",
	}),
	awayTeam: one(teams, {
		fields: [playoffSlots.awayTeamId],
		references: [teams.id],
		relationName: "slotAway",
	}),
	winner: one(teams, {
		fields: [playoffSlots.winnerId],
		references: [teams.id],
		relationName: "slotWinner",
	}),
	loser: one(teams, {
		fields: [playoffSlots.loserId],
		references: [teams.id],
		relationName: "slotLoser",
	}),
	match: one(matches, { fields: [playoffSlots.matchId], references: [matches.id] }),
}));

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

// ---------------------------------------------------------------------------
// SKIN_ACTIVATIONS — Temas visuales por torneo (Mundial, Copa América, Liga MX…)
//
// El catálogo visual de skins vive en CÓDIGO (shared/skins/registry.ts + bloques
// [data-skin] en globals.css). Esta tabla solo guarda ACTIVACIONES: qué skin
// está programado, con qué nombre, en qué rango de fechas y si está encendido.
//
// Resolución (features/tournament-skin): la activación habilitada cuyo rango
// incluye HOY (la más reciente por starts_on si hay overlap). Si no hay ninguna
// → la app usa la paleta TalachaStats de siempre (tokens --color-skin-* caen
// al brand por default en globals.css).
//
// Administrada exclusivamente por rol "owner" en /admin/temas.
// ---------------------------------------------------------------------------
export const skinActivations = pgTable(
	"skin_activations",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		// Id del skin en el registry de código. Se valida contra el registry en la
		// capa de feature — si un deploy elimina un skin, la fila queda inerte.
		skinId: text("skin_id").notNull(),
		name: text("name").notNull(), // etiqueta humana: "Mundial 2026"
		startsOn: date("starts_on").notNull(),
		endsOn: date("ends_on").notNull(),
		isEnabled: boolean("is_enabled").notNull().default(true),
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(t) => [
		index("sa_active_lookup_idx").on(t.isEnabled, t.startsOn, t.endsOn),
		check("chk_skin_activation_range", drizzleSql`${t.startsOn} <= ${t.endsOn}`),
	],
);

export type SkinActivation = typeof skinActivations.$inferSelect;
export type NewSkinActivation = typeof skinActivations.$inferInsert;
