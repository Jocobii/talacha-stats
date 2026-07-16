/**
 * GET  /api/leagues/[id]/suspensions — listado (B7, con nombre/equipo) + roster
 *   de la liga (para el picker de "Registrar sanción").
 * POST /api/leagues/[id]/suspensions — alta manual desde cero (B6/B7,
 *   panel "Registrar sanción" del mockup).
 */

import { apiSuccess, apiError } from "@/types";
import { getSessionUserFromRequest, canManageLeague } from "@/shared/lib/auth";
import { db } from "@/db";
import { leagues } from "@/db/schema";
import { eq } from "drizzle-orm";
import { CreateManualSuspensionSchema } from "@/entities/suspension";
import {
	createManualSuspension,
	listSuspensionsForLeague,
	searchRosterForLeague,
} from "@/features/discipline/manage-suspensions";

type Params = { params: Promise<{ id: string }> };

async function resolveLeagueWithGuard(request: Request, leagueId: string) {
	const session = await getSessionUserFromRequest(request);
	if (!session) return { session: null, error: apiError("No autenticado", 401) };

	const league = await db.query.leagues.findFirst({
		where: eq(leagues.id, leagueId),
		columns: { id: true, organizationId: true },
	});
	if (!league) return { session: null, error: apiError("Liga no encontrada", 404) };
	if (!canManageLeague(session, league.organizationId ?? null))
		return { session: null, error: apiError("Sin permiso", 403) };

	return { session, error: null };
}

export async function GET(request: Request, { params }: Params) {
	const { id } = await params;
	const { error } = await resolveLeagueWithGuard(request, id);
	if (error) return error;

	// `q` (opcional): búsqueda por nombre para el picker "Registrar sanción"
	// (autocomplete) — sin `q`, primeros 10 alfabéticamente. Nunca afecta el
	// listado de `suspensions`, que sigue completo.
	const { searchParams } = new URL(request.url);
	const q = searchParams.get("q") ?? undefined;

	const [suspensions, roster] = await Promise.all([
		listSuspensionsForLeague(id),
		searchRosterForLeague(id, { q, limit: 10 }),
	]);
	return apiSuccess({ suspensions, roster });
}

export async function POST(request: Request, { params }: Params) {
	const { id } = await params;
	const { session, error } = await resolveLeagueWithGuard(request, id);
	if (error) return error;

	const body = await request.json().catch(() => null);
	const parsed = CreateManualSuspensionSchema.safeParse(body);
	if (!parsed.success) return apiError(parsed.error.message, 400);

	const result = await createManualSuspension(id, parsed.data, session!.id);
	if (!result.ok) return apiError(result.error, result.status);
	return apiSuccess(result.suspension);
}
