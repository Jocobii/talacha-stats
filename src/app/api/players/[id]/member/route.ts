/**
 * PATCH /api/players/[id]/member
 *
 * Actualiza los campos editables de una inscripción (league_member) de un jugador.
 * Solo organizers pueden editar — y únicamente en sus propias ligas.
 * Owners pueden editar en cualquier liga.
 *
 * Body: { leagueMemberId, status?, dorsal?, internalNotes?, institutionPhotoUrl? }
 */

import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { db, leagueMembers, leagues } from "@/db";
import { apiSuccess, apiError } from "@/types";
import { getSessionUserFromRequest } from "@/shared/lib/auth";

const UpdateLeagueMemberSchema = z.object({
	leagueMemberId: z.string().uuid("leagueMemberId debe ser un UUID"),
	status: z.enum(["active", "suspended", "inactive"]).optional(),
	dorsal: z.number().int().min(1).max(99).nullable().optional(),
	internalNotes: z.string().max(1000).nullable().optional(),
	institutionPhotoUrl: z.string().url("URL inválida").nullable().optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
	const session = await getSessionUserFromRequest(request);
	if (!session) return apiError("No autenticado", 401);
	if (session.role !== "organizer" && session.role !== "owner") {
		return apiError("Sin permiso para editar inscripciones", 403);
	}

	const { id: globalPlayerId } = await params;

	const body = await request.json().catch(() => null);
	const parsed = UpdateLeagueMemberSchema.safeParse(body);
	if (!parsed.success) {
		return apiError(parsed.error.errors[0]?.message ?? "Datos inválidos", 400);
	}

	const { leagueMemberId, ...fields } = parsed.data;

	// Verificar que el league_member pertenece al globalPlayer y a la org del usuario
	const [member] = await db
		.select({
			id: leagueMembers.id,
			organizationId: leagues.organizationId,
		})
		.from(leagueMembers)
		.innerJoin(leagues, eq(leagues.id, leagueMembers.leagueId))
		.where(
			and(eq(leagueMembers.id, leagueMemberId), eq(leagueMembers.globalPlayerId, globalPlayerId)),
		)
		.limit(1);

	if (!member) {
		return apiError("Inscripción no encontrada", 404);
	}

	// Owners pueden editar cualquier liga; organizers solo la suya
	if (session.role === "organizer" && member.organizationId !== session.organizationId) {
		return apiError("No tienes permiso para editar esta inscripción", 403);
	}

	// Construir objeto de actualización con solo los campos presentes
	const update: Record<string, unknown> = {};
	if (fields.status !== undefined) update.status = fields.status;
	if (fields.dorsal !== undefined) update.dorsal = fields.dorsal;
	if (fields.internalNotes !== undefined) update.internalNotes = fields.internalNotes;
	if (fields.institutionPhotoUrl !== undefined)
		update.institutionPhotoUrl = fields.institutionPhotoUrl;

	if (Object.keys(update).length === 0) {
		return apiError("No se enviaron campos a actualizar", 400);
	}

	const [updated] = await db
		.update(leagueMembers)
		.set(update)
		.where(eq(leagueMembers.id, leagueMemberId))
		.returning();

	if (!updated) return apiError("No se pudo actualizar", 500);

	return apiSuccess({
		memberId: updated.id,
		status: updated.status,
		dorsal: updated.dorsal,
		internalNotes: updated.internalNotes,
		institutionPhotoUrl: updated.institutionPhotoUrl,
	});
}
