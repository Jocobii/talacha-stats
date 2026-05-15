/**
 * app/api/teams/[id]/roster/[memberId]/route.ts
 * PATCH — editar dorsal/estatus de un jugador en el roster.
 * DELETE — dar de baja del roster (elimina inscription, preserva leagueMember).
 */

import { eq, and } from "drizzle-orm";
import { db, inscriptions } from "@/db";
import { apiSuccess, apiError } from "@/types";
import { UpdateRosterMemberSchema } from "@/entities/team";
import { updateRosterMember, removeFromRoster } from "@/features/team-management/actions";

type RouteParams = { params: Promise<{ id: string; memberId: string }> };

/** Verifica que la inscription exista y pertenezca al equipo indicado. */
async function resolveInscription(teamId: string, memberId: string) {
	return db.query.inscriptions.findFirst({
		where: and(eq(inscriptions.teamId, teamId), eq(inscriptions.leagueMemberId, memberId)),
	});
}

export async function PATCH(request: Request, { params }: RouteParams) {
	const { id: teamId, memberId } = await params;
	const inscription = await resolveInscription(teamId, memberId);
	if (!inscription) return apiError("Jugador no encontrado en este equipo", 404);

	const body = await request.json().catch(() => null);
	const parsed = UpdateRosterMemberSchema.safeParse(body);
	if (!parsed.success) return apiError(parsed.error.message, 400);

	const updated = await updateRosterMember(memberId, parsed.data);
	return apiSuccess(updated);
}

export async function DELETE(_: Request, { params }: RouteParams) {
	const { id: teamId, memberId } = await params;
	const inscription = await resolveInscription(teamId, memberId);
	if (!inscription) return apiError("Jugador no encontrado en este equipo", 404);

	await removeFromRoster(memberId);
	return apiSuccess({ removed: true, memberId });
}
