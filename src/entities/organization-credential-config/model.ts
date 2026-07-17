/**
 * entities/organization-credential-config/model.ts
 *
 * Contratos del recurso organization-credential-config — qué modalidades de
 * pase (docs/CREDENCIAL-PASE-JUGADOR.md) puede emitir una organización.
 * Mismo patrón que entities/organization-config/model.ts.
 */

import { z } from "zod";
import type { organizationCredentialConfig } from "@/db/schema";

export type OrganizationCredentialConfig = typeof organizationCredentialConfig.$inferSelect;
export type NewOrganizationCredentialConfig = typeof organizationCredentialConfig.$inferInsert;

export type OrganizationCredentialConfigDto = Pick<
	OrganizationCredentialConfig,
	"organizationId" | "allowSingleLeaguePass" | "allowOrganizationPass"
>;

/**
 * PATCH de la config. Al menos una modalidad debe quedar habilitada — mismo
 * check que la DB (chk_credential_config_at_least_one), validado aquí también
 * para devolver un error de forma claro antes de llegar a Postgres.
 */
export const UpdateOrganizationCredentialConfigSchema = z
	.object({
		allowSingleLeaguePass: z.boolean().optional(),
		allowOrganizationPass: z.boolean().optional(),
	})
	.refine((data) => data.allowSingleLeaguePass !== false || data.allowOrganizationPass !== false, {
		message: "Debe permitir al menos una modalidad de pase",
	});

export type UpdateOrganizationCredentialConfigInput = z.infer<
	typeof UpdateOrganizationCredentialConfigSchema
>;
