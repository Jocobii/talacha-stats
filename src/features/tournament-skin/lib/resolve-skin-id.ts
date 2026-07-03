/**
 * features/tournament-skin/lib/resolve-skin-id.ts
 *
 * Frontera de confianza entre la DB y el registry de código: la DB puede
 * contener un skin_id que ya no existe (skin eliminado en un deploy). En ese
 * caso el sistema degrada en silencio a la paleta TalachaStats (null) — nunca
 * truena la página pública por una fila vieja.
 */

import { isSkinId, type SkinId } from "@/shared/skins/registry";

export function resolveSkinId(rawSkinId: string | null | undefined): SkinId | null {
	if (!rawSkinId) return null;
	if (!isSkinId(rawSkinId)) return null;
	return rawSkinId;
}
