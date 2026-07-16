/**
 * features/organization-rules/rules.ts
 *
 * Lógica server del "Reglamento por defecto" de la organización — calco de
 * features/tournament-rules/rules.ts, SIN locked_at: es una plantilla que se
 * copia a `league_config` al crear una liga (docs/ORG-PROFILE-HUB.md §0/§3);
 * nunca se congela.
 *
 * SOLO SERVER — importa @/db. No se re-exporta desde index.ts.
 */

import {
	findOrganizationConfigOrDefaults,
	upsertOrganizationConfig,
} from "@/entities/organization-config/queries";
import type {
	OrganizationConfigDto,
	UpdateOrganizationConfigInput,
} from "@/entities/organization-config";

/** Config resuelta con defaults — usarla para pintar el tab Reglamento. */
export async function getOrganizationRules(organizationId: string): Promise<OrganizationConfigDto> {
	return findOrganizationConfigOrDefaults(organizationId);
}

/**
 * Actualiza el default de organización. La UI solo reordena los 4 criterios
 * deportivos (USER_TIEBREAKER_CRITERIA); "name" se agrega siempre al fondo
 * — mismo tratamiento que updateLeagueRules.
 */
export async function updateOrganizationRules(
	organizationId: string,
	input: UpdateOrganizationConfigInput,
): Promise<OrganizationConfigDto> {
	const tiebreakers = input.tiebreakers ? [...input.tiebreakers, "name" as const] : undefined;

	return upsertOrganizationConfig(organizationId, {
		...input,
		...(tiebreakers && { tiebreakers }),
	});
}
