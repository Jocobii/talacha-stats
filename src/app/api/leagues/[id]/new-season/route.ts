/**
 * POST /api/leagues/[id]/new-season
 *
 * Controlador delgado (AGENTS.md §3.2): parsea, llama a `createNextSeason`
 * (features/season-rollover), responde. Toda la lógica de negocio y la
 * transacción viven en features/season-rollover/lib/ (§3.4).
 *
 * Ver features/season-rollover/lib/create-next-season.ts para el detalle de
 * qué se clona. El contrato de `confirmedTeamIds` (rollover real en vez de
 * clonación ciega) llega en NUEVA-TEMPORADA-V2.md §4.2.
 */
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { leagues } from "@/db/schema";
import { apiSuccess, apiError } from "@/types";
import { getSessionUserFromRequest, canManageLeague } from "@/shared/lib/auth";
import { createNextSeason } from "@/features/season-rollover/lib/create-next-season";

const NewSeasonSchema = z.object({
	season: z.string().min(1, "La temporada no puede estar vacía").max(50),
});

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
	const session = await getSessionUserFromRequest(request);
	if (!session) return apiError("No autenticado", 401);

	const { id: sourceId } = await params;

	const source = await db.query.leagues.findFirst({
		where: eq(leagues.id, sourceId),
		columns: {
			id: true,
			name: true,
			nameCanonical: true,
			category: true,
			dayOfWeek: true,
			city: true,
			organizationId: true,
			schedulingEnabled: true,
			code: true,
		},
	});
	if (!source) return apiError("Liga no encontrada", 404);
	if (!canManageLeague(session, source.organizationId ?? null)) {
		return apiError("Sin permiso", 403);
	}

	const body = await request.json().catch(() => null);
	const parsed = NewSeasonSchema.safeParse(body);
	if (!parsed.success) return apiError(parsed.error.issues[0].message, 400);

	const outcome = await createNextSeason(source, parsed.data);
	if (!outcome.ok) return apiError(outcome.error, outcome.status);

	return apiSuccess(outcome.result, 201);
}
