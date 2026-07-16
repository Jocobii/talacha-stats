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
import { eq, and, inArray, max, sql } from "drizzle-orm";
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

	// Calcular número siguiente e insertar dentro de una transacción con lock
	// a nivel de fila: sin esto, dos requests casi simultáneos (doble clic en
	// "Crear Jornada", o loadCurrent auto-creando mientras el usuario también
	// hace submit) leen el mismo MAX(number) antes de que el primer insert
	// confirme y ambos intentan crear la misma jornada → 23505 duplicate key.
	try {
		const inserted = await db.transaction(async (tx) => {
			// pg_advisory_xact_lock serializa por liga: la segunda transacción
			// concurrente espera a que la primera termine (commit o rollback)
			// antes de leer el MAX, así siempre ve el número ya insertado.
			await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${id} || ':matchday-create'))`);

			const [maxRow] = await tx
				.select({ maxNumber: max(matchdays.number) })
				.from(matchdays)
				.where(eq(matchdays.leagueId, id));

			const nextNumber = (maxRow?.maxNumber ?? 0) + 1;

			const [row] = await tx
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

			return row;
		});

		return apiSuccess(inserted, 201);
	} catch (err) {
		// Red de seguridad por si algo más (fuera de este endpoint) insertó con
		// el mismo número entre el lock y el insert. No debería pasar con el
		// advisory lock, pero evita un 500 crudo si ocurre.
		if (err && typeof err === "object" && "code" in err && err.code === "23505") {
			return apiError("Ya se está creando una jornada para esta liga, intenta de nuevo.", 409);
		}
		throw err;
	}
}
