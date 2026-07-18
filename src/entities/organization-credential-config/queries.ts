/**
 * entities/organization-credential-config/queries.ts
 * Acceso a DB para organization_credential_config. Sin validación de negocio
 * — eso vive en la feature que la use. Mismo patrón que
 * entities/organization-config/queries.ts.
 */

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { organizationCredentialConfig } from "@/db/schema";
import type { OrganizationCredentialConfigDto } from "./model";

type DbTx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type DbOrTx = typeof db | DbTx;

export const ORGANIZATION_CREDENTIAL_CONFIG_DTO_COLUMNS = {
	organizationId: organizationCredentialConfig.organizationId,
	allowSingleLeaguePass: organizationCredentialConfig.allowSingleLeaguePass,
	allowOrganizationPass: organizationCredentialConfig.allowOrganizationPass,
} as const;

/** null si la organización nunca configuró sus modalidades de pase. */
export async function findOrganizationCredentialConfig(
	organizationId: string,
	client: DbOrTx = db,
): Promise<OrganizationCredentialConfigDto | null> {
	const rows = await client
		.select(ORGANIZATION_CREDENTIAL_CONFIG_DTO_COLUMNS)
		.from(organizationCredentialConfig)
		.where(eq(organizationCredentialConfig.organizationId, organizationId))
		.limit(1);
	return rows[0] ?? null;
}

/**
 * Config resuelta con default "solo anual habilitado" cuando la organización
 * nunca la configuró — mismo default que la columna en DB.
 */
export async function findOrganizationCredentialConfigOrDefaults(
	organizationId: string,
	client: DbOrTx = db,
): Promise<OrganizationCredentialConfigDto> {
	const config = await findOrganizationCredentialConfig(organizationId, client);
	if (config) return config;
	return { organizationId, allowSingleLeaguePass: false, allowOrganizationPass: true };
}

export async function upsertOrganizationCredentialConfig(
	organizationId: string,
	values: Partial<Omit<OrganizationCredentialConfigDto, "organizationId">>,
): Promise<OrganizationCredentialConfigDto> {
	const [row] = await db
		.insert(organizationCredentialConfig)
		.values({ organizationId, ...values })
		.onConflictDoUpdate({
			target: organizationCredentialConfig.organizationId,
			set: { ...values, updatedAt: new Date() },
		})
		.returning(ORGANIZATION_CREDENTIAL_CONFIG_DTO_COLUMNS);
	return row!;
}
