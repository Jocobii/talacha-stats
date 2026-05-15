/**
 * POST /api/leagues/[id]/teams/bulk
 *
 * Crea múltiples equipos para una liga en una sola transacción.
 * Usada desde el wizard de onboarding (Paso 1 → Paso 2).
 */

import { apiSuccess, apiError } from "@/types";
import { getSessionUserFromRequest } from "@/shared/lib/auth";
import {
	bulkCreateTeams,
	BulkCreateTeamsSchema,
} from "@/features/league-onboarding/bulk-create-teams";
import { db, leagues } from "@/db";
import { eq } from "drizzle-orm";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
	const session = await getSessionUserFromRequest(request);
	if (!session) return apiError("No autenticado", 401);

	const { id } = await params;

	// Verificar que la liga existe y el usuario tiene acceso
	const league = await db.query.leagues.findFirst({
		where: eq(leagues.id, id),
		columns: { id: true, organizationId: true },
	});
	if (!league) return apiError("Liga no encontrada", 404);

	if (session.role === "organizer" && session.organizationId !== league.organizationId) {
		return apiError("Sin permiso", 403);
	}

	const body = await request.json().catch(() => null);
	const parsed = BulkCreateTeamsSchema.safeParse(body);
	if (!parsed.success) {
		return apiError(parsed.error.message, 400);
	}

	const created = await bulkCreateTeams(id, parsed.data);
	return apiSuccess(created, 201);
}
