/**
 * entities/organization-scheduling-config/queries.ts
 * Acceso a DB para organization_scheduling_config. Sin validación de negocio
 * (eso vive en el endpoint / seed que la use — mismo patrón que organization-config).
 */

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { organizationSchedulingConfig } from "@/db/schema";
import type { OrganizationSchedulingConfigDto } from "./model";

type DbTx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type DbOrTx = typeof db | DbTx;

export const ORGANIZATION_SCHEDULING_CONFIG_DTO_COLUMNS = {
	organizationId: organizationSchedulingConfig.organizationId,
	regularMatchdays: organizationSchedulingConfig.regularMatchdays,
	regularFormat: organizationSchedulingConfig.regularFormat,
	matchDurationMinutes: organizationSchedulingConfig.matchDurationMinutes,
	bufferMinutes: organizationSchedulingConfig.bufferMinutes,
	allowDuplicateMatchups: organizationSchedulingConfig.allowDuplicateMatchups,
	noRepeatWithin: organizationSchedulingConfig.noRepeatWithin,
} as const;

/** null si la organización nunca configuró su default de sorteo (caso normal). */
export async function findOrganizationSchedulingConfig(
	organizationId: string,
	client: DbOrTx = db,
): Promise<OrganizationSchedulingConfigDto | null> {
	const rows = await client
		.select(ORGANIZATION_SCHEDULING_CONFIG_DTO_COLUMNS)
		.from(organizationSchedulingConfig)
		.where(eq(organizationSchedulingConfig.organizationId, organizationId))
		.limit(1);
	return rows[0] ?? null;
}

export async function upsertOrganizationSchedulingConfig(
	organizationId: string,
	values: Partial<Omit<OrganizationSchedulingConfigDto, "organizationId">>,
): Promise<OrganizationSchedulingConfigDto> {
	const [row] = await db
		.insert(organizationSchedulingConfig)
		.values({ organizationId, ...values })
		.onConflictDoUpdate({
			target: organizationSchedulingConfig.organizationId,
			set: { ...values, updatedAt: new Date() },
		})
		.returning(ORGANIZATION_SCHEDULING_CONFIG_DTO_COLUMNS);
	return row!;
}
