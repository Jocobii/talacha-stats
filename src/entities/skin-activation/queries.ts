/**
 * entities/skin-activation/queries.ts
 * Acceso de LECTURA a DB para skin_activations.
 * Escrituras viven en features/tournament-skin/activations.ts.
 *
 * El filtrado por fecha/estado se hace en la query (WHERE), nunca en
 * memoria (§17). La validación del skinId contra el registry es
 * responsabilidad de features/tournament-skin.
 */

import { and, desc, eq, gte, lte } from "drizzle-orm";
import { db } from "@/db";
import { skinActivations } from "@/db/schema";
import type { SkinActivationDto } from "./model";

export const SKIN_ACTIVATION_DTO_COLUMNS = {
	id: skinActivations.id,
	skinId: skinActivations.skinId,
	name: skinActivations.name,
	startsOn: skinActivations.startsOn,
	endsOn: skinActivations.endsOn,
	isEnabled: skinActivations.isEnabled,
} as const;

/**
 * Activación habilitada cuyo rango incluye `today` ("YYYY-MM-DD").
 * Si hay overlap gana la de inicio más reciente (el torneo que arrancó último).
 */
export async function findActiveSkinActivation(today: string): Promise<SkinActivationDto | null> {
	const rows = await db
		.select(SKIN_ACTIVATION_DTO_COLUMNS)
		.from(skinActivations)
		.where(
			and(
				eq(skinActivations.isEnabled, true),
				lte(skinActivations.startsOn, today),
				gte(skinActivations.endsOn, today),
			),
		)
		.orderBy(desc(skinActivations.startsOn))
		.limit(1);
	return rows[0] ?? null;
}

/** Todas las activaciones para el panel admin, más recientes primero. */
export async function listSkinActivations(): Promise<SkinActivationDto[]> {
	return db
		.select(SKIN_ACTIVATION_DTO_COLUMNS)
		.from(skinActivations)
		.orderBy(desc(skinActivations.startsOn));
}
