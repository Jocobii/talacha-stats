/**
 * PATCH /api/leagues/[id]/playoffs/[bracketId]/slots/[slotId]
 *
 * Allows the admin to manually edit team assignments in a slot before the
 * bracket is locked (e.g., correct a seeding error). Only homeTeamId and
 * awayTeamId can be changed.
 */

import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { apiSuccess, apiError } from "@/types";
import { getSessionUserFromRequest, canManageLeague } from "@/shared/lib/auth";
import { db } from "@/db";
import { leagues, playoffBrackets, playoffSlots } from "@/db/schema";

type Params = { params: Promise<{ id: string; bracketId: string; slotId: string }> };

const PatchSlotSchema = z.object({
	homeTeamId: z.string().uuid().nullable().optional(),
	awayTeamId: z.string().uuid().nullable().optional(),
});

export async function PATCH(request: Request, { params }: Params) {
	const session = await getSessionUserFromRequest(request);
	if (!session) return apiError("No autenticado", 401);

	const { id: leagueId, bracketId, slotId } = await params;

	// Auth
	const league = await db.query.leagues.findFirst({
		where: eq(leagues.id, leagueId),
		with: { organization: { columns: { id: true } } },
		columns: { id: true },
	});
	if (!league) return apiError("Liga no encontrada", 404);
	if (!canManageLeague(session, league.organization?.id ?? null)) {
		return apiError("Sin permiso", 403);
	}

	// Verify bracket belongs to league
	const bracket = await db.query.playoffBrackets.findFirst({
		where: and(eq(playoffBrackets.id, bracketId), eq(playoffBrackets.leagueId, leagueId)),
		columns: { id: true },
	});
	if (!bracket) return apiError("Bracket no encontrado", 404);

	// Verify slot belongs to bracket
	const slot = await db.query.playoffSlots.findFirst({
		where: and(eq(playoffSlots.id, slotId), eq(playoffSlots.bracketId, bracketId)),
		columns: { id: true },
	});
	if (!slot) return apiError("Casilla no encontrada", 404);

	const body = await request.json().catch(() => ({}));
	const parsed = PatchSlotSchema.safeParse(body);
	if (!parsed.success) return apiError(parsed.error.message, 400);

	if (Object.keys(parsed.data).length === 0) {
		return apiError("Sin cambios.", 400);
	}

	const updates: Partial<typeof playoffSlots.$inferInsert> = {};
	if (parsed.data.homeTeamId !== undefined) updates.homeTeamId = parsed.data.homeTeamId;
	if (parsed.data.awayTeamId !== undefined) updates.awayTeamId = parsed.data.awayTeamId;

	const [updated] = await db
		.update(playoffSlots)
		.set(updates)
		.where(eq(playoffSlots.id, slotId))
		.returning();

	return apiSuccess(updated);
}
