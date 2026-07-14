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
