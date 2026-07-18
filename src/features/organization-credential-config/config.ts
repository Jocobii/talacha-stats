/**
 * features/organization-credential-config/config.ts
 *
 * Lógica server de la config de modalidades de pase de la organización —
 * calco de features/organization-rules/rules.ts. SOLO SERVER — importa @/db.
 * No se re-exporta desde index.ts.
 */

import {
	findOrganizationCredentialConfigOrDefaults,
	upsertOrganizationCredentialConfig,
} from "@/entities/organization-credential-config/queries";
import type {
	OrganizationCredentialConfigDto,
	UpdateOrganizationCredentialConfigInput,
} from "@/entities/organization-credential-config";

/** Config resuelta con defaults — usarla para pintar el tab de credenciales. */
export async function getOrganizationCredentialConfig(
	organizationId: string,
): Promise<OrganizationCredentialConfigDto> {
	return findOrganizationCredentialConfigOrDefaults(organizationId);
}

/** Actualiza la config. El check "al menos una modalidad" lo enforza la DB. */
export async function updateOrganizationCredentialConfig(
	organizationId: string,
	input: UpdateOrganizationCredentialConfigInput,
): Promise<OrganizationCredentialConfigDto> {
	return upsertOrganizationCredentialConfig(organizationId, input);
}
