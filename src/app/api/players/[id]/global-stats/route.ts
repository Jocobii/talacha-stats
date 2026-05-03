/**
 * GET /api/players/[id]/global-stats
 *
 * Estadisticas globales verificadas de un jugador cross-org.
 * Solo profiles con claim_status='verified' contribuyen a los totales.
 *
 * Returns 404 if the player has no verified claims.
 */

import { getPlayerGlobalStats } from "@/entities/player";
import { apiSuccess, apiError } from "@/types";
import { z } from "zod";

const ParamsSchema = z.object({
	id: z.string().uuid("id debe ser un UUID valido"),
});

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
	const raw = await params;
	const parsed = ParamsSchema.safeParse(raw);
	if (!parsed.success) return apiError(parsed.error.issues[0].message, 400);

	const stats = await getPlayerGlobalStats(parsed.data.id);
	if (!stats) {
		return apiError("Jugador no encontrado o sin estadisticas verificadas", 404);
	}

	return apiSuccess(stats);
}
