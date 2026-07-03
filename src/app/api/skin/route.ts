/**
 * GET /api/skin — skin de torneo activo (público, para Client Components).
 * Los Server Components NO pegan aquí: llaman getActiveSkinId() directo.
 */

import type { ActiveSkinResponse } from "@/entities/skin-activation";
import { getActiveSkinId } from "@/features/tournament-skin/get-active-skin";
import { apiSuccess } from "@/types";

export async function GET() {
	try {
		const skinId = await getActiveSkinId();
		return apiSuccess<ActiveSkinResponse>({ skinId });
	} catch (caughtError) {
		// El público nunca se rompe por el tema: degradar a paleta TalachaStats.
		console.error("getActiveSkinId failed", caughtError);
		return apiSuccess<ActiveSkinResponse>({ skinId: null });
	}
}
