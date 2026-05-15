/**
 * app/api/teams/[id]/route.ts
 * PATCH — actualizar nombre/color del equipo.
 * DELETE — disolver equipo (libera jugadores, preserva historial).
 */

import { eq } from "drizzle-orm";
import { db, teams } from "@/db";
import { apiSuccess, apiError } from "@/types";
import { UpdateTeamSchema } from "@/entities/team";
import { updateTeamInfo, dissolveTeam } from "@/features/team-management/actions";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function resolveTeam(id: string) {
	if (!UUID_REGEX.test(id)) return null;
	return db.query.teams.findFirst({ where: eq(teams.id, id) });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const team = await resolveTeam(id);
	if (!team) return apiError("Equipo no encontrado", 404);

	const body = await request.json().catch(() => null);
	const parsed = UpdateTeamSchema.safeParse(body);
	if (!parsed.success) return apiError(parsed.error.message, 400);

	const updated = await updateTeamInfo(id, parsed.data);
	return apiSuccess(updated);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const team = await resolveTeam(id);
	if (!team) return apiError("Equipo no encontrado", 404);

	// Requerir confirmacion con nombre del equipo en el body
	const body = (await request.json().catch(() => ({}))) as { confirm?: string };
	if (body.confirm !== team.name) {
		return apiError("Escribe el nombre del equipo para confirmar la eliminacion", 400);
	}

	await dissolveTeam(id);
	return apiSuccess({ dissolved: true, teamId: id });
}
