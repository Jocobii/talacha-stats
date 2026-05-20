/**
 * PATCH /api/matches/[id]/stats/[registrationId]
 * Autosave parcial de las stats de un jugador en un partido.
 */
import { apiSuccess, apiError } from "@/types";
import { getSessionUserFromRequest, canManageLeague } from "@/shared/lib/auth";
import { db } from "@/db";
import { matches } from "@/db/schema";
import { eq } from "drizzle-orm";
import { autosaveStat } from "@/features/match-resolution/autosave-stat";
import { AutosaveStatSchema } from "@/entities/match/model";

type Params = { params: Promise<{ id: string; registrationId: string }> };

export async function PATCH(request: Request, { params }: Params) {
	const session = await getSessionUserFromRequest(request);
	if (!session) return apiError("No autenticado", 401);

	const { id, registrationId } = await params;

	const match = await db.query.matches.findFirst({
		where: eq(matches.id, id),
		with: { league: { columns: { organizationId: true } } },
	});
	if (!match) return apiError("Partido no encontrado", 404);
	if (!canManageLeague(session, match.league?.organizationId ?? null)) {
		return apiError("Sin permiso", 403);
	}

	const body = await request.json().catch(() => ({}));
	const parsed = AutosaveStatSchema.safeParse(body);
	if (!parsed.success) return apiError(parsed.error.message, 400);

	await autosaveStat(id, registrationId, parsed.data);
	return apiSuccess({ ok: true });
}
