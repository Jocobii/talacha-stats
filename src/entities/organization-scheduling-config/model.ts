/**
 * entities/organization-scheduling-config/model.ts
 *
 * Contratos del recurso organization-scheduling-config (§7.4). Es la
 * PLANTILLA que se copia a `league_scheduling_config` al crear una liga
 * (docs/ORG-PROFILE-HUB.md §3, Épica Q) — no hay resolución en vivo.
 *
 * `regularMatchdays` es nullable a propósito (decisión D-2, confirmada por
 * Jocobi): null = "automático, calcular por nº de equipos al crear la liga";
 * un número explícito = "esta organización siempre juega N jornadas".
 */

import { z } from "zod";
import type { organizationSchedulingConfig } from "@/db/schema";

export type OrganizationSchedulingConfig = typeof organizationSchedulingConfig.$inferSelect;
export type NewOrganizationSchedulingConfig = typeof organizationSchedulingConfig.$inferInsert;

export type OrganizationSchedulingConfigDto = Pick<
	OrganizationSchedulingConfig,
	| "organizationId"
	| "regularMatchdays"
	| "regularFormat"
	| "matchDurationMinutes"
	| "bufferMinutes"
	| "allowDuplicateMatchups"
	| "noRepeatWithin"
>;

/** PATCH del default de sorteo de organización — mismos rangos que SchedulingConfigSchema (liga). */
export const UpdateOrganizationSchedulingConfigSchema = z.object({
	regularMatchdays: z.number().int().min(1).max(50).nullable().optional(),
	regularFormat: z.enum(["single", "double"]).optional(),
	matchDurationMinutes: z.number().int().min(20).max(120).optional(),
	bufferMinutes: z.number().int().min(0).max(5).optional(),
	noRepeatWithin: z.number().int().min(0).max(20).optional(),
	allowDuplicateMatchups: z.boolean().optional(),
});
export type UpdateOrganizationSchedulingConfigInput = z.infer<
	typeof UpdateOrganizationSchedulingConfigSchema
>;
