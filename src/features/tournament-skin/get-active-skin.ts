/**
 * features/tournament-skin/get-active-skin.ts
 *
 * Punto de entrada server-side del skin activo. Los Server Components lo
 * llaman directo (sin hop HTTP); `cache()` deduplica por request, así varios
 * módulos con <SkinScope> en la misma página cuestan UNA query indexada.
 */

import { cache } from "react";
import { findActiveSkinActivation } from "@/entities/skin-activation";
import type { SkinId } from "@/shared/skins/registry";
import { resolveSkinId } from "./lib/resolve-skin-id";
import { todayIso } from "./lib/today-iso";

export const getActiveSkinId = cache(async (): Promise<SkinId | null> => {
	const activation = await findActiveSkinActivation(todayIso());
	return resolveSkinId(activation?.skinId);
});
