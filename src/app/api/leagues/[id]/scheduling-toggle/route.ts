/**
 * POST /api/leagues/[id]/scheduling-toggle
 * Activa o desactiva el módulo de sorteo para una liga.
 * Solo owners pueden usar este endpoint.
 */

import { db } from "@/db";
import { leagues } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { apiSuccess, apiError } from "@/types";
import { getSessionUserFromRequest } from "@/shared/lib/auth";

const ToggleSchema = z.object({
	enabled: z.boolean(),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
	const session = await getSessionUserFromRequest(request);
	if (!session) return apiError("No autenticado", 401);
	if (session.role !== "owner") return apiError("Solo owners pueden activar este módulo", 403);

	const { id } = await params;

	const league = await db.query.leagues.findFirst({
		where: eq(leagues.id, id),
		columns: { id: true, organizationId: true },
	});
	if (!league) return apiError("Liga no encontrada", 404);

	const body = await request.json().catch(() => null);
	const parsed = ToggleSchema.safeParse(body);
	if (!parsed.success) return apiError("Body inválido: se esperaba { enabled: boolean }", 400);

	await db
		.update(leagues)
		.set({ schedulingEnabled: parsed.data.enabled })
		.where(eq(leagues.id, id));

	return apiSuccess({ id, schedulingEnabled: parsed.data.enabled });
}
