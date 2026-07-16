/**
 * PATCH /api/suspensions/[id] — escalar (matches → time/permanent) o
 * levantar una suspensión (B6, §5.2 docs/MODULOS-GESTION-LIGA.md). No lleva
 * leagueId en la ruta: se resuelve la suspensión primero para saber a qué
 * liga pertenece y así validar el permiso del organizador.
 */

import { apiSuccess, apiError } from "@/types";
import { getSessionUserFromRequest, canManageLeague } from "@/shared/lib/auth";
import { db } from "@/db";
import { leagues } from "@/db/schema";
import { eq } from "drizzle-orm";
import { EscalateSuspensionSchema } from "@/entities/suspension";
import { findSuspension } from "@/entities/suspension/queries";
import { escalateSuspension } from "@/features/discipline/manage-suspensions";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
	const { id } = await params;

	const session = await getSessionUserFromRequest(request);
	if (!session) return apiError("No autenticado", 401);

	const suspension = await findSuspension(id);
	if (!suspension) return apiError("Suspensión no encontrada", 404);

	const league = await db.query.leagues.findFirst({
		where: eq(leagues.id, suspension.leagueId),
		columns: { id: true, organizationId: true },
	});
	if (!league) return apiError("Liga no encontrada", 404);
	if (!canManageLeague(session, league.organizationId ?? null)) return apiError("Sin permiso", 403);

	const body = await request.json().catch(() => null);
	const parsed = EscalateSuspensionSchema.safeParse(body);
	if (!parsed.success) return apiError(parsed.error.message, 400);

	const result = await escalateSuspension(id, parsed.data, session.id);
	if (!result.ok) return apiError(result.error, result.status);
	return apiSuccess(result.suspension);
}
