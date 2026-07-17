/**
 * entities/match/model.ts
 * Tipos de dominio para la entidad Match.
 */

import { z } from "zod";
import type { Match } from "@/db/schema";
import { RESOLUTION_STATUSES } from "@/db/schema";

export type { Match };

/**
 * Match con relaciones del módulo de sorteo.
 * El tipo exacto se infiere desde los queries; este alias es para
 * documentar la forma esperada en el resto del codebase.
 */
export type MatchWithRelations = Match & {
	matchday: { id: string; number: number; phase: string; scheduledDate: string } | null;
	venue: { id: string; name: string; city: string | null } | null;
};

// ---------------------------------------------------------------------------
// Schemas del módulo de Resolución de Partidos
// ---------------------------------------------------------------------------

export const MatchStatusSchema = z.enum(RESOLUTION_STATUSES);
export type MatchStatus = z.infer<typeof MatchStatusSchema>;

export const MatchPlayerStatSchema = z.object({
	playerRegistrationId: z.string().uuid(),
	isPresent: z.boolean(),
	shirtNumber: z.number().int().min(1).max(99).nullable(),
	goals: z.number().int().min(0).max(20),
	assists: z.number().int().min(0).max(20),
	yellowCards: z.number().int().min(0).max(3),
	blueCards: z.number().int().min(0).max(3),
	redCards: z.number().int().min(0).max(1),
});
export type MatchPlayerStatInput = z.infer<typeof MatchPlayerStatSchema>;

export const ResolveMatchSchema = z.object({
	status: MatchStatusSchema,
	homeScore: z.number().int().min(0).max(99).nullable(),
	awayScore: z.number().int().min(0).max(99).nullable(),
	homeBonusGoals: z.number().int().min(0).max(99).default(0),
	awayBonusGoals: z.number().int().min(0).max(99).default(0),
	refereeObservations: z.string().max(2000).nullable(),
	homePlayers: z.array(MatchPlayerStatSchema),
	awayPlayers: z.array(MatchPlayerStatSchema),
});
export type ResolveMatchInput = z.infer<typeof ResolveMatchSchema>;

export const AutosaveStatSchema = MatchPlayerStatSchema.partial().omit({
	playerRegistrationId: true,
});
export type AutosaveStatInput = z.infer<typeof AutosaveStatSchema>;

/**
 * Respuesta de POST /api/matches/[id]/resolve. Tipo nombrado único (§7.4):
 * lo devuelve el route y lo consume el cliente vía `apiFetch<ResolveMatchResult>`.
 * `nextMatchId` alimenta el flujo "Guardar y siguiente".
 */
export type ResolveMatchResult = {
	nextMatchId: string | null;
};

export const AutosaveMatchFieldsSchema = z.object({
	homeScore: z.number().int().min(0).max(99).nullable().optional(),
	awayScore: z.number().int().min(0).max(99).nullable().optional(),
	homeBonusGoals: z.number().int().min(0).max(99).optional(),
	awayBonusGoals: z.number().int().min(0).max(99).optional(),
	refereeObservations: z.string().max(2000).nullable().optional(),
});
export type AutosaveMatchFieldsInput = z.infer<typeof AutosaveMatchFieldsSchema>;

/** Datos completos para la pantalla de captura de un partido */
export type MatchResolutionData = {
	match: {
		id: string;
		cedula: string | null;
		status: string;
		homeScore: number | null;
		awayScore: number | null;
		homeBonusGoals: number;
		awayBonusGoals: number;
		refereeObservations: string | null;
		matchDate: string;
		kickoffAt: Date | null;
	};
	matchday: {
		id: string;
		number: number;
		scheduledDate: string;
	} | null;
	league: {
		id: string;
		name: string;
		code: string | null;
	};
	homeTeam: {
		id: string;
		name: string;
		color: string | null;
	};
	awayTeam: {
		id: string;
		name: string;
		color: string | null;
	};
	homePlayers: PlayerResolutionRow[];
	awayPlayers: PlayerResolutionRow[];
};

// ---------------------------------------------------------------------------
// Cédula imprimible (docs/PLAN-CEDULA-IMPRESA.md)
// ---------------------------------------------------------------------------

/**
 * Razón por la que un jugador no puede jugar, en orden de importancia
 * (Jocobi, jul 2026): 1) sin credencial (pase) vigente, 2) suspensión activa.
 * Si ambas aplican, gana "credential" — se resuelve así en
 * `entities/match/queries.ts` antes de construir la fila.
 */
export type CedulaBlockedReason = "credential" | "suspension";

/** Fila de jugador para la hoja impresa. Sin `credential_code` no aparece (decisión de Jocobi, ver plan §12.2). */
export type CedulaPlayerRow = {
	globalPlayerId: string;
	fullName: string;
	credentialCode: number;
	dorsal: number | null;
	/** null si el jugador puede jugar; si no, el motivo (credencial o suspensión) + tag/leyenda a imprimir. */
	blocked: { reason: CedulaBlockedReason; tag: string; why: string } | null;
};

/** Datos completos de un partido para su hoja de cédula imprimible. */
export type CedulaMatchData = {
	matchId: string;
	cedula: string | null;
	matchdayNumber: number | null;
	matchDate: string;
	kickoffAt: Date | null;
	venueName: string | null;
	league: { name: string; code: string | null; season: string; category: string | null };
	homeTeam: { id: string; name: string };
	awayTeam: { id: string; name: string };
	homePlayers: CedulaPlayerRow[];
	awayPlayers: CedulaPlayerRow[];
};

export type PlayerResolutionRow = {
	registrationId: string;
	playerProfileId: string | null;
	fullName: string;
	jerseyNumber: number | null;
	/** Código de credencial (league_members.credential_code). null = ad-hoc/sin credencial. */
	credentialCode: number | null;
	isAdHoc: boolean;
	/** Stats existentes, null si el partido nunca fue capturado */
	stat: {
		id: string;
		isPresent: boolean;
		shirtNumber: number | null;
		goals: number;
		assists: number;
		yellowCards: number;
		blueCards: number;
		redCards: number;
	} | null;
	/** null si el jugador puede jugar; si está suspendido, el tag + motivo/plazo (mismo cruce que la cédula). */
	suspended: { tag: string; why: string } | null;
};
