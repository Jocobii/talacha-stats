/**
 * GET /api/venues/[id]/events?start=ISO&end=ISO
 * Devuelve eventos unificados (partidos de torneo + rentas) de una cancha
 * en el rango de fechas indicado. Idempotente y sin efectos secundarios.
 */

import { apiSuccess, apiError } from "@/types";
import { getSessionUserFromRequest } from "@/shared/lib/auth";
import { db } from "@/db";
import { venues } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getVenueEvents } from "@/features/venue-calendar";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
	const session = await getSessionUserFromRequest(request);
	if (!session) return apiError("No autenticado", 401);

	const { id } = await params;
	const { searchParams } = new URL(request.url);
	const startStr = searchParams.get("start");
	const endStr = searchParams.get("end");

	if (!startStr || !endStr) return apiError("Se requieren los parámetros start y end", 400);

	const start = new Date(startStr);
	const end = new Date(endStr);
	if (isNaN(start.getTime()) || isNaN(end.getTime())) {
		return apiError("Formato de fecha inválido. Use ISO 8601.", 400);
	}

	const venue = await db.query.venues.findFirst({
		where: eq(venues.id, id),
		columns: { id: true, organizationId: true },
	});
	if (!venue) return apiError("Cancha no encontrada", 404);

	const canAccess =
		session.role === "owner" ||
		(session.role === "organizer" && session.organizationId === venue.organizationId);
	if (!canAccess) return apiError("Sin permiso", 403);

	const events = await getVenueEvents({ venueId: id, start, end });
	return apiSuccess(events);
}
