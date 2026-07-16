/**
 * entities/league-config/model.ts
 *
 * Contratos del recurso league-config (§7.4): DTOs nombrados que comparten
 * los API routes (tipado de salida) y los hooks de features (genérico de
 * apiFetch). Los tipos de fila se infieren del schema Drizzle (§4.1).
 *
 * La validación de bloqueo (locked_at) vive en features/tournament-rules,
 * no aquí — esta entidad solo modela forma y defaults del recurso.
 */

import { z } from "zod";
import type { leagueConfig } from "@/db/schema";

export type LeagueConfig = typeof leagueConfig.$inferSelect;
export type NewLeagueConfig = typeof leagueConfig.$inferInsert;

/** Criterios de desempate soportados, en el orden en que pueden encadenarse. */
export const TIEBREAKER_CRITERIA = [
	"points",
	"head_to_head",
	"goal_diff",
	"goals_for",
	"name",
] as const;
export type TiebreakerCriterion = (typeof TIEBREAKER_CRITERIA)[number];

export const DEFAULT_TIEBREAKERS: TiebreakerCriterion[] = [
	"points",
	"head_to_head",
	"goal_diff",
	"goals_for",
	"name",
];

/**
 * Criterios que el organizador puede reordenar en la UI (Reglamento del
 * torneo). "name" NUNCA se expone: es el desempate técnico final que
 * garantiza un orden total, no una decisión deportiva — el feature lo
 * agrega siempre al final si no viene en el input (ver updateLeagueRules).
 */
export const USER_TIEBREAKER_CRITERIA = [
	"points",
	"head_to_head",
	"goal_diff",
	"goals_for",
] as const;
export type UserTiebreakerCriterion = (typeof USER_TIEBREAKER_CRITERIA)[number];

/** Significado de la tarjeta azul — no estándar entre ligas amateur mexicanas. */
export const BLUE_CARD_MEANINGS = ["temp", "yellow", "none"] as const;
export type BlueCardMeaning = (typeof BLUE_CARD_MEANINGS)[number];

/** GET /api/leagues/[id]/config */
export type LeagueConfigDto = Pick<
	LeagueConfig,
	| "leagueId"
	| "pointsWin"
	| "pointsDraw"
	| "tiebreakers"
	| "yellowThreshold"
	| "redCardMatches"
	| "blueCardMeaning"
	| "reinforcementLimit"
	| "financeLevel"
	| "lockedAt"
>;

/**
 * PATCH /api/leagues/[id]/config — campos editables. `tiebreakers` viaja sin
 * "name" (la UI solo reordena los 4 criterios deportivos); el feature lo
 * agrega al final antes de guardar.
 */
export const UpdateLeagueConfigSchema = z.object({
	pointsWin: z.number().int().min(0).max(10).optional(),
	pointsDraw: z.number().int().min(0).max(10).optional(),
	tiebreakers: z
		.array(z.enum(USER_TIEBREAKER_CRITERIA))
		.min(1)
		.refine((arr) => new Set(arr).size === arr.length, "No se permiten criterios repetidos")
		.optional(),
	yellowThreshold: z.number().int().min(1).max(20).optional(),
	redCardMatches: z.number().int().min(1).max(10).optional(),
	blueCardMeaning: z.enum(BLUE_CARD_MEANINGS).optional(),
	reinforcementLimit: z.number().int().min(0).nullable().optional(),
	financeLevel: z.union([z.literal(0), z.literal(1), z.literal(2)]).optional(),
});
export type UpdateLeagueConfigInput = z.infer<typeof UpdateLeagueConfigSchema>;
