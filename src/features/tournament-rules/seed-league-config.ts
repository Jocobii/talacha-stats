/**
 * features/tournament-rules/seed-league-config.ts
 *
 * Copia `organization_config` a `league_config` al crear una liga nueva
 * (§4.5 de docs/MODULOS-GESTION-LIGA.md — copy-on-create, no herencia en
 * vivo). No-op si la organización no tiene default propio: la liga cae en
 * los defaults del sistema vía `findLeagueConfigOrDefaults`.
 *
 * SOLO SERVER — importa @/db. No se re-exporta desde index.ts.
 */

import type { db } from "@/db";
import { findOrganizationConfig } from "@/entities/organization-config/queries";
import { insertLeagueConfig } from "@/entities/league-config/queries";

type DbTx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type DbOrTx = typeof db | DbTx;

export async function seedLeagueConfig(
	client: DbOrTx,
	leagueId: string,
	organizationId: string | null,
): Promise<void> {
	if (!organizationId) return;

	const orgDefaults = await findOrganizationConfig(organizationId, client);
	if (!orgDefaults) return;

	await insertLeagueConfig(
		leagueId,
		{
			pointsWin: orgDefaults.pointsWin,
			pointsDraw: orgDefaults.pointsDraw,
			tiebreakers: orgDefaults.tiebreakers,
			yellowThreshold: orgDefaults.yellowThreshold,
			redCardMatches: orgDefaults.redCardMatches,
			blueCardMeaning: orgDefaults.blueCardMeaning,
			reinforcementLimit: orgDefaults.reinforcementLimit,
			financeLevel: orgDefaults.financeLevel,
		},
		client,
	);
}
