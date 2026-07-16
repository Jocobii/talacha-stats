/**
 * features/scheduling/config/seed-league-scheduling-config.ts
 *
 * Copia `organization_scheduling_config` a `league_scheduling_config` al
 * crear una liga nueva (docs/ORG-PROFILE-HUB.md §3, Épica Q) — mismo
 * principio copy-on-create que seedLeagueConfig (tournament-rules).
 *
 * No-op si:
 * - la organización no tiene default de sorteo propio, o
 * - el default deja `regularMatchdays` en automático (null): a esta altura
 *   la liga todavía no tiene equipos, así que "automático por nº de
 *   equipos" no se puede resolver aquí — la liga cae en el flujo actual
 *   (sin fila hasta que se guarde el sorteo por primera vez).
 *
 * SOLO SERVER — importa @/db. No se re-exporta desde ningún barrel de cliente.
 */

import type { db } from "@/db";
import { leagueSchedulingConfig } from "@/db/schema";
import { findOrganizationSchedulingConfig } from "@/entities/organization-scheduling-config/queries";

type DbTx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type DbOrTx = typeof db | DbTx;

export async function seedLeagueSchedulingConfig(
	client: DbOrTx,
	leagueId: string,
	organizationId: string | null,
): Promise<void> {
	if (!organizationId) return;

	const orgDefaults = await findOrganizationSchedulingConfig(organizationId, client);
	if (!orgDefaults) return;
	if (orgDefaults.regularMatchdays === null) return;

	await client
		.insert(leagueSchedulingConfig)
		.values({
			leagueId,
			regularMatchdays: orgDefaults.regularMatchdays,
			regularFormat: orgDefaults.regularFormat,
			matchDurationMinutes: orgDefaults.matchDurationMinutes,
			bufferMinutes: orgDefaults.bufferMinutes,
			allowDuplicateMatchups: orgDefaults.allowDuplicateMatchups,
			noRepeatWithin: orgDefaults.noRepeatWithin,
		})
		.onConflictDoNothing();
}
