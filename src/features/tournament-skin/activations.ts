/**
 * features/tournament-skin/activations.ts
 *
 * Lógica server del CRUD de activaciones (las escrituras viven en la feature,
 * las lecturas en entities — mismo patrón que venue-management). Los routes
 * validan con Zod y delegan aquí (§3.2). Devuelven DTOs de entities; el
 * cliente los mapea a ViewModels en sus hooks (§19).
 */

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { skinActivations } from "@/db/schema";
import {
	listSkinActivations,
	SKIN_ACTIVATION_DTO_COLUMNS,
	type SkinActivationDto,
} from "@/entities/skin-activation";
import type { ActivationFormInput } from "./model/activation-form-schema";

export async function getSkinActivations(): Promise<SkinActivationDto[]> {
	return listSkinActivations();
}

export async function createSkinActivation(input: ActivationFormInput): Promise<SkinActivationDto> {
	const [created] = await db
		.insert(skinActivations)
		.values(input)
		.returning(SKIN_ACTIVATION_DTO_COLUMNS);
	return created;
}

/** null si el id no existe. */
export async function toggleSkinActivation(
	id: string,
	isEnabled: boolean,
): Promise<SkinActivationDto | null> {
	const rows = await db
		.update(skinActivations)
		.set({ isEnabled, updatedAt: new Date() })
		.where(eq(skinActivations.id, id))
		.returning(SKIN_ACTIVATION_DTO_COLUMNS);
	return rows[0] ?? null;
}

/** true si borró; false si el id no existía. */
export async function removeSkinActivation(id: string): Promise<boolean> {
	const rows = await db
		.delete(skinActivations)
		.where(eq(skinActivations.id, id))
		.returning({ id: skinActivations.id });
	return rows.length > 0;
}
