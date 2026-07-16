/**
 * entities/organization-config/model.ts
 *
 * Contratos del recurso organization-config (§7.4). Es la PLANTILLA que se
 * copia a `league_config` al crear una liga (§4.5 de
 * docs/MODULOS-GESTION-LIGA.md) — no hay resolución en vivo, así que este
 * DTO reusa el mismo catálogo de criterios/significados que league-config
 * en vez de duplicarlo.
 */

import { z } from "zod";
import type { organizationConfig } from "@/db/schema";
import { BLUE_CARD_MEANINGS, USER_TIEBREAKER_CRITERIA } from "@/entities/league-config";

export type OrganizationConfig = typeof organizationConfig.$inferSelect;
export type NewOrganizationConfig = typeof organizationConfig.$inferInsert;

export type OrganizationConfigDto = Pick<
	OrganizationConfig,
	| "organizationId"
	| "pointsWin"
	| "pointsDraw"
	| "tiebreakers"
	| "yellowThreshold"
	| "redCardMatches"
	| "blueCardMeaning"
	| "reinforcementLimit"
	| "financeLevel"
>;

/** PATCH del default de organización — mismas reglas de forma que league-config. */
export const UpdateOrganizationConfigSchema = z.object({
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
export type UpdateOrganizationConfigInput = z.infer<typeof UpdateOrganizationConfigSchema>;
