/**
 * GET /api/matches/[id]
 * Retorna los datos completos para la pantalla de captura de partido.
 *
 * PATCH /api/matches/[id]
 * Autosave parcial de campos del partido (marcador, bonus, observaciones).
 * NO cambia status — eso va por /resolve.
 */
import { apiSuccess, apiError } from "@/types";
import { getSessionUserFromRequest, canManageLeague } from "@/shared/lib/auth";
import { db } from "@/db";
import { matches } from "@/db/schema";
import { eq } from "drizzle-orm";
import { loadMatchForResolution } from "@/features/match-resolution/load-match";
import { autosaveMatchField } from "@/features/match-resolution/autosave-stat";
import { AutosaveMatchFieldsSchema } from "@/entities/match/model";

type Params = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Params) {
	const { id } = await params;
	const data = await loadMatchForResolution(id);
	if (!data) return apiError("Partido no encontrado", 404);
	return apiSuccess(data);
}

export async function PATCH(request: Request, { params }: Params) {
	const session = await getSessionUserFromRequest(request);
	if (!session) return apiError("No autenticado", 401);

	const { id } = await params;

	const match = await db.query.matches.findFirst({
		where: eq(matches.id, id),
		with: { league: { columns: { organizationId: true } } },
	});
	if (!match) return apiError("Partido no encontrado", 404);
	if (!canManageLeague(session, match.league?.organizationId ?? null)) {
		return apiError("Sin permiso", 403);
	}

	const body = await request.json().catch(() => ({}));
	const parsed = AutosaveMatchFieldsSchema.safeParse(body);
	if (!parsed.success) return apiError(parsed.error.message, 400);

	await autosaveMatchField(id, parsed.data);
	return apiSuccess({ ok: true });
}
