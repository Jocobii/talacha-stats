/**
 * entities/suspension/model.ts
 *
 * Contratos del recurso suspension (§7.4). Los tipos de fila se infieren del
 * schema Drizzle (§4.1); los catálogos (reason, duration_type, etc.) se
 * redeclaran aquí en vez de importar los `check()` de schema.ts — mismo
 * patrón que entities/league-config, para que este módulo sea 100%
 * client-safe (ningún import de @/db).
 */

import { z } from "zod";
import type { suspensions } from "@/db/schema";

export type Suspension = typeof suspensions.$inferSelect;
export type NewSuspension = typeof suspensions.$inferInsert;

export const SUSPENSION_REASONS = ["yellow_accumulation", "red_card", "manual"] as const;
export type SuspensionReason = (typeof SUSPENSION_REASONS)[number];

export const SUSPENSION_DURATION_TYPES = ["matches", "time", "permanent"] as const;
export type SuspensionDurationType = (typeof SUSPENSION_DURATION_TYPES)[number];

export const SUSPENSION_DURATION_UNITS = ["days", "weeks", "months"] as const;
export type SuspensionDurationUnit = (typeof SUSPENSION_DURATION_UNITS)[number];

export const SUSPENSION_STATUSES = ["active", "served", "lifted"] as const;
export type SuspensionStatus = (typeof SUSPENSION_STATUSES)[number];

/** Fila completa — lo que devuelven los endpoints de disciplina. */
export type SuspensionDto = Pick<
	Suspension,
	| "id"
	| "globalPlayerId"
	| "leagueId"
	| "reason"
	| "reasonDetail"
	| "durationType"
	| "matchesTotal"
	| "matchesServed"
	| "durationValue"
	| "durationUnit"
	| "startsOn"
	| "endsOn"
	| "status"
	| "sourceMatchId"
	| "recordedBy"
	| "createdAt"
>;

/**
 * PATCH /api/suspensions/[id] — acción manual del organizador (§2.1/§5.2 doc).
 * `action` es la decisión, no un campo de la fila: "escalate" mueve la
 * suspensión a 'time' o 'permanent' (nunca de vuelta a 'matches' — esa es la
 * única vía automática); "lift" la perdona sin tocar su duration_type.
 */
export const EscalateSuspensionSchema = z.discriminatedUnion("action", [
	z.object({
		action: z.literal("escalate"),
		durationType: z.literal("time"),
		durationValue: z.number().int().min(1).max(52),
		durationUnit: z.enum(SUSPENSION_DURATION_UNITS),
		reasonDetail: z.string().min(1).max(500),
	}),
	z.object({
		action: z.literal("escalate"),
		durationType: z.literal("permanent"),
		reasonDetail: z.string().min(1).max(500),
	}),
	z.object({
		action: z.literal("lift"),
		reasonDetail: z.string().min(1).max(500).optional(),
	}),
]);
export type EscalateSuspensionInput = z.infer<typeof EscalateSuspensionSchema>;

/**
 * POST /api/leagues/[id]/suspensions — alta manual desde cero (organizador
 * registra un caso, ej. agresión, que no pasó por el motor automático).
 * `reason` siempre es "manual" — el motor automático es la única vía para
 * "red_card"/"yellow_accumulation" (B3). Discriminado por `durationType`
 * porque cada modo pide campos distintos, igual que EscalateSuspensionSchema.
 */
export const CreateManualSuspensionSchema = z.discriminatedUnion("durationType", [
	z.object({
		durationType: z.literal("matches"),
		globalPlayerId: z.string().uuid(),
		matchesTotal: z.number().int().min(1).max(20),
		reasonDetail: z.string().min(1).max(500),
	}),
	z.object({
		durationType: z.literal("time"),
		globalPlayerId: z.string().uuid(),
		durationValue: z.number().int().min(1).max(52),
		durationUnit: z.enum(SUSPENSION_DURATION_UNITS),
		reasonDetail: z.string().min(1).max(500),
	}),
	z.object({
		durationType: z.literal("permanent"),
		globalPlayerId: z.string().uuid(),
		reasonDetail: z.string().min(1).max(500),
	}),
]);
export type CreateManualSuspensionInput = z.infer<typeof CreateManualSuspensionSchema>;

/** Fila de listado (B7): la suspensión + lo mínimo del jugador/equipo para pintar la lista. */
export type SuspensionListItemDto = SuspensionDto & {
	playerName: string;
	teamName: string;
};

/** Jugador elegible para "Registrar sanción" — roster vigente de la liga. */
export type SuspensionRosterPlayer = {
	globalPlayerId: string;
	fullName: string;
	teamName: string;
};

/**
 * Fila de listado GLOBAL (B7b, /admin/suspensiones): igual que
 * SuspensionListItemDto pero con el nombre de la liga, para poder ver y
 * operar sanciones de varias ligas sin cambiar de pantalla — flujo de
 * "domingo en la noche" con lista de suspendidos de distintas ligas.
 */
export type GlobalSuspensionListItemDto = SuspensionListItemDto & {
	leagueName: string;
};

/** Liga elegible en los filtros/selector de la vista global. */
export type SuspensionLeagueOption = {
	id: string;
	name: string;
};
