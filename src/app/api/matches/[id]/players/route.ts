/**
 * POST /api/matches/[id]/players
 * Agrega un jugador ad-hoc al partido.
 */
import { z } from "zod";
import { apiSuccess, apiError } from "@/types";
import { getSessionUserFromRequest, canManageLeague } from "@/shared/lib/auth";
import { db } from "@/db";
import { matches } from "@/db/schema";
import { eq } from "drizzle-orm";
import { addAdHocPlayer } from "@/features/match-resolution/add-ad-hoc-player";

const AddAdHocSchema = z.object({
	teamSide: z.enum(["home", "away"]),
	fullName: z.string().min(2).max(100),
	shirtNumber: z.number().int().min(1).max(99),
});

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
	const session = await getSessionUserFromRequest(request);
	if (!session) return apiError("No autenticado", 401);
	if (!session.organizationId) return apiError("Sin organización asignada", 403);

	const { id } = await params;

	const match = await db.query.matches.findFirst({
		where: eq(matches.id, id),
		with: { league: { columns: { organizationId: true } } },
		columns: { id: true },
	});
	if (!match) return apiError("Partido no encontrado", 404);
	if (!canManageLeague(session, match.league?.organizationId ?? null)) {
		return apiError("Sin permiso", 403);
	}

	const body = await request.json().catch(() => ({}));
	const parsed = AddAdHocSchema.safeParse(body);
	if (!parsed.success) return apiError(parsed.error.message, 400);

	try {
		const result = await addAdHocPlayer({
			matchId: id,
			organizationId: session.organizationId,
			...parsed.data,
		});
		return apiSuccess(result, 201);
	} catch (err) {
		const e = err as Error & { code?: string; existingRegistrationId?: string };
		if (e.code === "DUPLICATE_PLAYER") {
			return apiError(e.message, 409);
		}
		throw err;
	}
}
