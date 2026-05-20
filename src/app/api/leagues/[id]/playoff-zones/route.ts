/**
 * app/api/leagues/[id]/playoff-zones/route.ts
 *
 * GET  — lista todas las zonas de una liga, ordenadas por `order`
 * POST — crea una nueva zona de clasificación
 */

import { z } from "zod";
import { eq, asc } from "drizzle-orm";
import { db } from "@/db";
import { leagues, leaguePlayoffZones } from "@/db/schema";
import { apiSuccess, apiError } from "@/types";

const VALID_COLORS = ["green", "blue", "amber", "rose", "purple", "orange", "cyan"] as const;

const CreateZoneSchema = z.object({
	name: z.string().min(1).max(60),
	fromPosition: z.number().int().min(1),
	toPosition: z.number().int().min(1),
	color: z.enum(VALID_COLORS).default("green"),
	order: z.number().int().default(0),
});

type RouteCtx = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: RouteCtx) {
	const { id } = await params;

	const league = await db.query.leagues.findFirst({ where: eq(leagues.id, id) });
	if (!league) return apiError("Liga no encontrada", 404);

	const zones = await db.query.leaguePlayoffZones.findMany({
		where: eq(leaguePlayoffZones.leagueId, id),
		orderBy: [asc(leaguePlayoffZones.order), asc(leaguePlayoffZones.fromPosition)],
	});

	return apiSuccess(zones);
}

export async function POST(request: Request, { params }: RouteCtx) {
	const { id } = await params;

	const league = await db.query.leagues.findFirst({ where: eq(leagues.id, id) });
	if (!league) return apiError("Liga no encontrada", 404);

	const body = await request.json();
	const parsed = CreateZoneSchema.safeParse(body);
	if (!parsed.success) return apiError(parsed.error.message, 400);

	const { name, fromPosition, toPosition, color, order } = parsed.data;

	if (fromPosition > toPosition) {
		return apiError("fromPosition debe ser menor o igual a toPosition", 400);
	}

	// Verificar solapamiento con zonas existentes
	const existing = await db.query.leaguePlayoffZones.findMany({
		where: eq(leaguePlayoffZones.leagueId, id),
	});

	const overlapping = existing.find(
		(z) => fromPosition <= z.toPosition && toPosition >= z.fromPosition,
	);
	if (overlapping) {
		return apiError(
			`Las posiciones ${fromPosition}–${toPosition} se solapan con la zona "${overlapping.name}" (${overlapping.fromPosition}–${overlapping.toPosition}).`,
			409,
		);
	}

	const [created] = await db
		.insert(leaguePlayoffZones)
		.values({ leagueId: id, name, fromPosition, toPosition, color, order })
		.returning();

	return apiSuccess(created, 201);
}
