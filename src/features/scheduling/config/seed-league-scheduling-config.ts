/**
 * features/scheduling/config/seed-league-scheduling-config.ts
 *
 * Copia `organization_scheduling_config` a `league_scheduling_config` al
 * crear una liga nueva (docs/ORG-PROFILE-HUB.md §3, Épica Q) — mismo
 * principio copy-on-create que seedLeagueConfig (tournament-rules).
 *
 * Si la organización tiene un default de sorteo propio, la liga SIEMPRE
 * hereda — sin excepción (decisión Jocobi). `regularMatchdays` es el único
 * campo que puede quedar sin resolver en el default de la org (null =
 * "automático por nº de equipos"); como a esta altura la liga todavía no
 * tiene equipos y la columna es NOT NULL, usamos
 * `DEFAULT_REGULAR_MATCHDAYS` como valor sembrable de partida — el
 * organizador lo ajusta después en Parámetros sin que eso bloquee la
 * herencia de duración/buffer/formato/no-repetir/permitir-repetidos.
 *
 * No-op solo si la organización no tiene default de sorteo propio.
 *
 * SOLO SERVER — importa @/db. No se re-exporta desde ningún barrel de cliente.
 */

import type { db } from "@/db";
import { leagueSchedulingConfig } from "@/db/schema";
import { findOrganizationSchedulingConfig } from "@/entities/organization-scheduling-config/queries";
import { DEFAULT_REGULAR_MATCHDAYS } from "../constants";

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

	await client
		.insert(leagueSchedulingConfig)
		.values({
			leagueId,
			regularMatchdays: orgDefaults.regularMatchdays ?? DEFAULT_REGULAR_MATCHDAYS,
			regularFormat: orgDefaults.regularFormat,
			matchDurationMinutes: orgDefaults.matchDurationMinutes,
			bufferMinutes: orgDefaults.bufferMinutes,
			allowDuplicateMatchups: orgDefaults.allowDuplicateMatchups,
			noRepeatWithin: orgDefaults.noRepeatWithin,
		})
		.onConflictDoNothing();
}
