/**
 * app/api/leagues/[id]/playoff-zones/[zoneId]/route.ts
 *
 * DELETE — elimina una zona de clasificación
 * PATCH  — actualiza nombre, posiciones o color de una zona
 */

import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { leaguePlayoffZones } from "@/db/schema";
import { apiSuccess, apiError } from "@/types";

const VALID_COLORS = ["green", "blue", "amber", "rose", "purple", "orange", "cyan"] as const;

const PatchZoneSchema = z.object({
	name: z.string().min(1).max(60).optional(),
	fromPosition: z.number().int().min(1).optional(),
	toPosition: z.number().int().min(1).optional(),
	color: z.enum(VALID_COLORS).optional(),
	order: z.number().int().optional(),
});

type RouteCtx = { params: Promise<{ id: string; zoneId: string }> };

export async function DELETE(_: Request, { params }: RouteCtx) {
	const { id, zoneId } = await params;

	const zone = await db.query.leaguePlayoffZones.findFirst({
		where: and(eq(leaguePlayoffZones.id, zoneId), eq(leaguePlayoffZones.leagueId, id)),
	});
	if (!zone) return apiError("Zona no encontrada", 404);

	await db
		.delete(leaguePlayoffZones)
		.where(and(eq(leaguePlayoffZones.id, zoneId), eq(leaguePlayoffZones.leagueId, id)));

	return apiSuccess({ deleted: zoneId });
}

export async function PATCH(request: Request, { params }: RouteCtx) {
	const { id, zoneId } = await params;

	const zone = await db.query.leaguePlayoffZones.findFirst({
		where: and(eq(leaguePlayoffZones.id, zoneId), eq(leaguePlayoffZones.leagueId, id)),
	});
	if (!zone) return apiError("Zona no encontrada", 404);

	const body = await request.json();
	const parsed = PatchZoneSchema.safeParse(body);
	if (!parsed.success) return apiError(parsed.error.message, 400);

	const updates = parsed.data;
	const from = updates.fromPosition ?? zone.fromPosition;
	const to = updates.toPosition ?? zone.toPosition;
	if (from > to) return apiError("fromPosition debe ser menor o igual a toPosition", 400);

	// Verificar solapamiento con otras zonas (excluir la zona que se está editando)
	const siblings = await db.query.leaguePlayoffZones.findMany({
		where: eq(leaguePlayoffZones.leagueId, id),
	});
	const overlapping = siblings.find(
		(z) => z.id !== zoneId && from <= z.toPosition && to >= z.fromPosition,
	);
	if (overlapping) {
		return apiError(
			`Las posiciones ${from}–${to} se solapan con la zona "${overlapping.name}" (${overlapping.fromPosition}–${overlapping.toPosition}).`,
			409,
		);
	}

	const [updated] = await db
		.update(leaguePlayoffZones)
		.set(updates)
		.where(and(eq(leaguePlayoffZones.id, zoneId), eq(leaguePlayoffZones.leagueId, id)))
		.returning();

	return apiSuccess(updated);
}
