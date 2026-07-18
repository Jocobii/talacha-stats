/**
 * entities/player/model.ts
 * Tipos del dominio para el perfil de jugador.
 * Cubre la visión cross-liga: un jugador puede estar en múltiples ligas
 * simultáneamente (mismo día, distinta hora/cancha).
 */

import type { globalPlayers } from "@/db/schema";

// Fila mínima del directorio público de jugadores (GET /api/players, §7.4).
// Migrado a V2 (global_players + league_members) — ver searchDirectoryPlayers
// en queries.ts. `global_players` no tiene columna `alias` (apodo, solo
// existía en la tabla V1 `players`), por eso ya no aparece aquí.
// Inferida de la tabla — nunca duplicada a mano (§4.1).
export type PlayerListItem = Pick<typeof globalPlayers.$inferSelect, "id" | "fullName">;

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
	contributions: number; // goals + assists
	yellowCards: number;
	redCards: number;
	mvpCount: number;
	matchesPlayed: number;
	goalsPerMatch: number; // métrica principal de rendimiento
	source: "season_stats" | "live_match_stats"; // Excel histórico vs. cálculo en vivo desde la cédula (§live-stats.ts)
	leagueStatus: "active" | "finished"; // activa o terminada (explícito o por sucesor)
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
	goalsPerMatch: number; // métrica principal — normaliza diferencias de jornadas
};

// Posición de un jugador en los distintos scopes de ranking
export type PlayerPositions = {
	league: { rank: number; total: number; goals: number } | null;
	city: { rank: number; total: number; goals: number; cityName: string } | null;
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
	| "multi_league" // jugando en 2+ ligas simultáneas
	| "on_streak" // 3+ partidos consecutivos anotando
	| "mvp" // tiene registros de MVP
	| "hat_trick_club" // 3+ goles en algún partido
	| "marksman" // promedio >= 1.0 gol/partido (mínimo 5 PJ)
	| "veteran"; // 25+ partidos jugados en total

// Stats de ego calculadas en el backend — para el perfil público del jugador
export type PlayerEgoStats = {
	positions: PlayerPositions;
	cityTopPercent: number | null; // Math.ceil(rank / total * 100), null si no aplica
	goalStreak: number; // partidos consecutivos anotando (racha activa)
	hatTricks: number; // cantidad de hat-tricks históricos
	teamGoalShares: PlayerTeamGoalShare[];
	badges: PlayerBadge[];
};

// Perfil completo del jugador (getPlayerProfile, keyed por global_players.id).
// `alias`/`phone` quedan siempre en null: global_players no tiene columna de
// apodo (solo existía en la tabla V1 `players`) y `phone` vive en
// league_members como dato privado por liga (§14 AGENTS.md) — no corresponde
// exponerlo en un perfil público aunque existiera.
export type PlayerView = {
	id: string;
	fullName: string;
	alias: string | null;
	phone: string | null;
	photoUrl: string | null;
	global: PlayerGlobalProfile;
	leagues: PlayerLeagueStats[]; // ordenadas: más goles primero
};

// ---------------------------------------------------------------------------
// PlayerGlobalStats — Agregacion cross-org para identidades verificadas
// (Historia 05)
//
// Leida desde la vista player_global_stats.
// Solo profiles con claim_status='verified' contribuyen a estos totales.
// ---------------------------------------------------------------------------
export type PlayerGlobalStats = {
	playerId: string;
	fullName: string;
	alias: string | null;
	organizationsCount: number;
	leaguesCount: number;
	totalGoals: number;
	totalAssists: number;
	totalMatchesPlayed: number;
	totalYellowCards: number;
	totalRedCards: number;
	lastUpdatedAt: Date | null;
};

// ===========================================================================
// BREAKING CHANGE — Ecosistema de identidad global (admin-ecosystem branch)
//
// Schemas Zod + tipos inferidos para las tres nuevas entidades:
//   GlobalPlayer   → identidad única anclada en CURP (sha256)
//   LeagueMember   → pertenencia de un jugador a una liga
//   Inscription    → asignación del league_member a un equipo (1 por liga)
//
// Regla: un tipo = un schema Zod. Sin tipos manuales duplicados.
// ===========================================================================

import { z } from "zod";
import { LEAGUE_MEMBER_STATUSES, GENDER_OPTIONS } from "@/db/schema";

// ---------------------------------------------------------------------------
// Helpers de validación compartidos
// ---------------------------------------------------------------------------

/**
 * CURP mexicana: 18 caracteres en formato oficial RECA-890101-H-BCABC-A-0.
 * Validación de formato solamente — la verificación real ocurre en ventanilla
 * cuando el oficinista comprueba la INE física del jugador.
 */
export const CurpSchema = z
	.string()
	.trim()
	.toUpperCase()
	.regex(
		/^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/,
		"CURP inválida — debe tener 18 caracteres en formato oficial",
	);

/**
 * Hash sha256 hex del CURP — 64 caracteres hex en minúsculas.
 * Es el único dato del CURP que viaja entre cliente y servidor.
 * El CURP raw nunca se persiste ni se loguea.
 */
export const CurpHashSchema = z
	.string()
	.length(64, "El hash debe tener exactamente 64 caracteres")
	.regex(/^[0-9a-f]+$/, "El hash debe ser hexadecimal en minúsculas");

/** Fecha ISO 8601 (YYYY-MM-DD) — formato que retorna Drizzle para columnas `date`. */
const isoDate = z
	.string()
	.regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha debe estar en formato YYYY-MM-DD");

/** Género del jugador — opcional en toda la cadena (columna nullable en DB). */
export const GenderSchema = z.enum(GENDER_OPTIONS);
export type Gender = z.infer<typeof GenderSchema>;

// ---------------------------------------------------------------------------
// GlobalPlayer — identidad global del jugador
// ---------------------------------------------------------------------------

export const GlobalPlayerSchema = z.object({
	id: z.string().uuid(),
	curpHash: CurpHashSchema,
	fullName: z.string().min(2).max(100),
	birthDate: isoDate,
	// Opcional (no solo nullable): la mayoría de jugadores existentes no tienen
	// este dato — no forzar a todos los sitios que construyen un GlobalPlayer
	// a declararlo explícitamente.
	gender: GenderSchema.nullable().optional(),
	avatarUrl: z.string().url().nullable(),
	createdAt: z.coerce.date(),
});

export type GlobalPlayer = z.infer<typeof GlobalPlayerSchema>;

/**
 * Input de creación: el servidor genera el curpHash a partir del CURP raw.
 * El cliente nunca envía el curpHash directamente — solo el CURP en el POST.
 */
export const CreateGlobalPlayerSchema = z.object({
	curpHash: CurpHashSchema,
	fullName: z.string().min(2).max(100).trim(),
	birthDate: isoDate,
	gender: GenderSchema.nullable().optional(),
	avatarUrl: z.string().url().nullable().optional(),
});

export type CreateGlobalPlayer = z.infer<typeof CreateGlobalPlayerSchema>;

// ---------------------------------------------------------------------------
// LeagueMember — pertenencia de un jugador a una liga específica
// ---------------------------------------------------------------------------

export const LeagueMemberStatusSchema = z.enum(LEAGUE_MEMBER_STATUSES);

export const LeagueMemberSchema = z.object({
	id: z.string().uuid(),
	globalPlayerId: z.string().uuid(),
	leagueId: z.string().uuid(),
	status: LeagueMemberStatusSchema,
	dorsal: z.number().int().min(1).max(99).nullable(),
	// Código de credencial — único por liga, inmutable, asignado por el server
	// con assignNextCredential(). Nunca viene del cliente (no está en
	// CreateLeagueMemberSchema). Ver docs/CREDENCIAL-CODIGO-JUGADOR.md.
	credentialCode: z.number().int().min(1).nullable(),
	// Qué pase (player_credentials) autoriza esta inscripción. Asignado por el
	// server al registrar (§5) o al re-vincular en Nueva Temporada (§6). Nunca
	// lo propone el cliente (no está en CreateLeagueMemberSchema).
	// Ver docs/CREDENCIAL-PASE-JUGADOR.md.
	credentialId: z.string().uuid().nullable(),
	inscriptionDate: isoDate,
	// Data siloing: estos campos son privados de la liga.
	// Solo se incluyen en queries scoped a una liga — nunca cross-liga.
	institutionPhotoUrl: z.string().url().nullable(),
	internalNotes: z.string().max(500).nullable(),
	// Datos de contacto — opcionales (no solo nullable), "por si hay una
	// emergencia". Mismo siloing que internalNotes. Opcional para no romper
	// los sitios existentes que construyen un LeagueMember sin estos campos.
	phone: z.string().max(30).nullable().optional(),
	residenceArea: z.string().max(150).nullable().optional(),
	emergencyContactName: z.string().max(150).nullable().optional(),
	emergencyContactPhone: z.string().max(30).nullable().optional(),
	medicalNotes: z.string().max(500).nullable().optional(),
	createdAt: z.coerce.date(),
});

export type LeagueMember = z.infer<typeof LeagueMemberSchema>;

export const CreateLeagueMemberSchema = z.object({
	globalPlayerId: z.string().uuid(),
	leagueId: z.string().uuid(),
	status: LeagueMemberStatusSchema.optional().default("active"),
	dorsal: z.number().int().min(1).max(99).nullable().optional(),
	inscriptionDate: isoDate,
	institutionPhotoUrl: z.string().url().nullable().optional(),
	internalNotes: z.string().max(500).nullable().optional(),
	phone: z.string().max(30).nullable().optional(),
	residenceArea: z.string().max(150).nullable().optional(),
	emergencyContactName: z.string().max(150).nullable().optional(),
	emergencyContactPhone: z.string().max(30).nullable().optional(),
	medicalNotes: z.string().max(500).nullable().optional(),
});

export type CreateLeagueMember = z.infer<typeof CreateLeagueMemberSchema>;

// ---------------------------------------------------------------------------
// Inscription — asignación del league_member a un equipo
//
// UNIQUE(league_member_id): un jugador solo puede pertenecer a un equipo
// por liga. Para transferir: eliminar la inscripción anterior + crear nueva.
// ---------------------------------------------------------------------------

export const InscriptionSchema = z.object({
	id: z.string().uuid(),
	leagueMemberId: z.string().uuid(),
	teamId: z.string().uuid(),
	createdAt: z.coerce.date(),
});

export type Inscription = z.infer<typeof InscriptionSchema>;

export const CreateInscriptionSchema = z.object({
	leagueMemberId: z.string().uuid(),
	teamId: z.string().uuid(),
});

export type CreateInscription = z.infer<typeof CreateInscriptionSchema>;

// ---------------------------------------------------------------------------
// Tipos compuestos — usados en features y respuestas de API
// ---------------------------------------------------------------------------

/**
 * Respuesta del endpoint GET /api/players/lookup.
 * El curpHash nunca sale del servidor — se omite del resultado.
 */
export const PlayerLookupResultSchema = z.object({
	found: z.literal(true),
	player: GlobalPlayerSchema.omit({ curpHash: true }).extend({
		/** Número de ligas (league_members) en las que ya ha participado. */
		previousLeaguesCount: z.number().int().nonnegative(),
	}),
});

export const PlayerNotFoundSchema = z.object({
	found: z.literal(false),
});

export const LookupResponseSchema = z.discriminatedUnion("found", [
	PlayerLookupResultSchema,
	PlayerNotFoundSchema,
]);

export type LookupResponse = z.infer<typeof LookupResponseSchema>;

/**
 * Vista combinada para la UI del panel de registro y el narrador.
 * Fusiona los datos globales del jugador con su membresía en la liga.
 */
export const LeagueMemberViewSchema = GlobalPlayerSchema.omit({
	curpHash: true,
	createdAt: true,
}).merge(
	z.object({
		memberId: z.string().uuid(), // league_members.id
		leagueId: z.string().uuid(),
		status: LeagueMemberStatusSchema,
		dorsal: z.number().int().min(1).max(99).nullable(),
		inscriptionDate: isoDate,
		teamId: z.string().uuid().nullable(), // null si aún no inscrito en equipo
		teamName: z.string().nullable(),
	}),
);

export type LeagueMemberView = z.infer<typeof LeagueMemberViewSchema>;
