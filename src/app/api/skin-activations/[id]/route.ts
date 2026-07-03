/**
 * /api/skin-activations/[id] — toggle y borrado de una activación. Solo "owner".
 */

import { ToggleSkinActivationSchema } from "@/entities/skin-activation";
import { removeSkinActivation, toggleSkinActivation } from "@/features/tournament-skin/activations";
import { getSessionUserFromRequest, type SessionUser } from "@/shared/lib/auth";
import { apiError, apiSuccess } from "@/types";

type RouteContext = { params: Promise<{ id: string }> };

async function requireOwner(request: Request): Promise<SessionUser | null> {
	const user = await getSessionUserFromRequest(request);
	if (!user || user.role !== "owner") return null;
	return user;
}

export async function PATCH(request: Request, { params }: RouteContext) {
	const owner = await requireOwner(request);
	if (!owner) return apiError("Solo el owner puede administrar temas", 403);

	const parsed = ToggleSkinActivationSchema.safeParse(await request.json());
	if (!parsed.success) return apiError("Datos inválidos", 400);

	const { id } = await params;
	try {
		const updated = await toggleSkinActivation(id, parsed.data.isEnabled);
		if (!updated) return apiError("Activación no encontrada", 404);
		return apiSuccess(updated);
	} catch (caughtError) {
		console.error("toggleSkinActivation failed", caughtError);
		return apiError("No se pudo actualizar el tema", 500);
	}
}

export async function DELETE(request: Request, { params }: RouteContext) {
	const owner = await requireOwner(request);
	if (!owner) return apiError("Solo el owner puede administrar temas", 403);

	const { id } = await params;
	try {
		const removed = await removeSkinActivation(id);
		if (!removed) return apiError("Activación no encontrada", 404);
		return apiSuccess(null);
	} catch (caughtError) {
		console.error("removeSkinActivation failed", caughtError);
		return apiError("No se pudo borrar el tema", 500);
	}
}
