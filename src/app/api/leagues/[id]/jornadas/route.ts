/**
 * POST /api/leagues/[id]/jornadas
 *
 * Crea la siguiente jornada (draft) para la liga.
 * Error 409 si ya existe una jornada en draft o published.
 */

import { z } from "zod";
import { apiSuccess, apiError } from "@/types";
import { getSessionUserFromRequest, canManageLeague } from "@/shared/lib/auth";
import { db } from "@/db";
import { leagues, matchdays } from "@/db/schema";
import { eq, and, inArray, max } from "drizzle-orm";
import { MATCHDAY_STATUSES } from "@/features/scheduling/constants";

type Params = { params: Promise<{ id: string }> };

const CreateJornadaSchema = z.object({
	scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato YYYY-MM-DD requerido"),
});

const ACTIVE_STATUSES: (typeof MATCHDAY_STATUSES)[number][] = ["draft", "published"];

export async function POST(request: Request, { params }: Params) {
	const session = await getSessionUserFromRequest(request);
	if (!session) return apiError("No autenticado", 401);

	const { id } = await params;

	const league = await db.query.leagues.findFirst({
		where: eq(leagues.id, id),
		columns: { id: true, organizationId: true, schedulingEnabled: true },
	});
	if (!league) return apiError("Liga no encontrada", 404);
	if (!league.schedulingEnabled) return apiError("Módulo de sorteo no habilitado", 400);
	if (!canManageLeague(session, league.organizationId ?? null)) return apiError("Sin permiso", 403);

	const body = await request.json().catch(() => ({}));
	const parsed = CreateJornadaSchema.safeParse(body);
	if (!parsed.success) return apiError(parsed.error.message, 400);

	// 409 si ya hay una jornada activa
	const existing = await db.query.matchdays.findFirst({
		where: and(eq(matchdays.leagueId, id), inArray(matchdays.status, ACTIVE_STATUSES)),
		columns: { id: true, number: true, status: true },
	});
	if (existing) {
		return apiError(
			`Ya existe la jornada ${existing.number} en estado "${existing.status}". Ciérrala antes de crear una nueva.`,
			409,
		);
	}

	// Calcular número siguiente
	const [maxRow] = await db
		.select({ maxNumber: max(matchdays.number) })
		.from(matchdays)
		.where(eq(matchdays.leagueId, id));

	const nextNumber = (maxRow?.maxNumber ?? 0) + 1;

	const [inserted] = await db
		.insert(matchdays)
		.values({
			leagueId: id,
			number: nextNumber,
			phase: "regular",
			scheduledDate: parsed.data.scheduledDate,
			status: "draft",
		})
		.returning({
			id: matchdays.id,
			number: matchdays.number,
			scheduledDate: matchdays.scheduledDate,
			status: matchdays.status,
		});

	return apiSuccess(inserted, 201);
}
