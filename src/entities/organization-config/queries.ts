/**
 * entities/organization-config/queries.ts
 * Acceso a DB para organization_config. Sin validación de negocio — eso
 * vive en la feature que la use (tournament-rules o el seed de alta de liga).
 */

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { organizationConfig } from "@/db/schema";
import type { OrganizationConfigDto } from "./model";

type DbTx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type DbOrTx = typeof db | DbTx;

export const ORGANIZATION_CONFIG_DTO_COLUMNS = {
	organizationId: organizationConfig.organizationId,
	pointsWin: organizationConfig.pointsWin,
	pointsDraw: organizationConfig.pointsDraw,
	tiebreakers: organizationConfig.tiebreakers,
	yellowThreshold: organizationConfig.yellowThreshold,
	redCardMatches: organizationConfig.redCardMatches,
	blueCardMeaning: organizationConfig.blueCardMeaning,
	reinforcementLimit: organizationConfig.reinforcementLimit,
	financeLevel: organizationConfig.financeLevel,
} as const;

/** null si la organización nunca configuró su default (caso normal — informal). */
export async function findOrganizationConfig(
	organizationId: string,
	client: DbOrTx = db,
): Promise<OrganizationConfigDto | null> {
	const rows = await client
		.select(ORGANIZATION_CONFIG_DTO_COLUMNS)
		.from(organizationConfig)
		.where(eq(organizationConfig.organizationId, organizationId))
		.limit(1);
	return rows[0] ?? null;
}

export async function upsertOrganizationConfig(
	organizationId: string,
	values: Partial<Omit<OrganizationConfigDto, "organizationId">>,
): Promise<OrganizationConfigDto> {
	const [row] = await db
		.insert(organizationConfig)
		.values({ organizationId, ...values })
		.onConflictDoUpdate({
			target: organizationConfig.organizationId,
			set: { ...values, updatedAt: new Date() },
		})
		.returning(ORGANIZATION_CONFIG_DTO_COLUMNS);
	return row!;
}
