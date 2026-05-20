/**
 * GET /api/leagues/[id]/matches/by-cedula?q=...
 * Búsqueda de partidos por cédula (parcial). Acepta sólo dígitos o texto completo.
 */
import { z } from "zod";
import { apiSuccess, apiError } from "@/types";
import { getSessionUserFromRequest, canManageLeague } from "@/shared/lib/auth";
import { db } from "@/db";
import { leagues } from "@/db/schema";
import { eq } from "drizzle-orm";
import { findMatchByCedula } from "@/entities/match/queries";

const QuerySchema = z.object({
	q: z.string().min(1).max(20),
});

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
	const session = await getSessionUserFromRequest(request);
	if (!session) return apiError("No autenticado", 401);

	const { id } = await params;

	const league = await db.query.leagues.findFirst({
		where: eq(leagues.id, id),
		columns: { organizationId: true },
	});
	if (!league) return apiError("Liga no encontrada", 404);
	if (!canManageLeague(session, league.organizationId ?? null)) {
		return apiError("Sin permiso", 403);
	}

	const { searchParams } = new URL(request.url);
	const parsed = QuerySchema.safeParse({ q: searchParams.get("q") ?? "" });
	if (!parsed.success) return apiError("Parámetro q requerido (1-20 chars)", 400);

	const results = await findMatchByCedula(id, parsed.data.q);

	return apiSuccess(
		results.map((m) => ({
			id: m.id,
			cedula: m.cedula,
			homeTeamName: m.homeTeam.name,
			awayTeamName: m.awayTeam.name,
			status: m.status,
			roundNumber: m.matchday?.number ?? null,
		})),
	);
}
