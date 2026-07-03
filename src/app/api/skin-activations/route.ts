/**
 * /api/skin-activations — CRUD de activaciones de tema. Solo rol "owner":
 * el tema por torneo es configuración global de la app, no por organización.
 */

import { createSkinActivation, getSkinActivations } from "@/features/tournament-skin/activations";
import { ActivationFormSchema } from "@/features/tournament-skin/model/activation-form-schema";
import { getSessionUserFromRequest, type SessionUser } from "@/shared/lib/auth";
import { apiError, apiSuccess } from "@/types";

async function requireOwner(request: Request): Promise<SessionUser | null> {
	const user = await getSessionUserFromRequest(request);
	if (!user || user.role !== "owner") return null;
	return user;
}

export async function GET(request: Request) {
	const owner = await requireOwner(request);
	if (!owner) return apiError("Solo el owner puede administrar temas", 403);

	try {
		const activations = await getSkinActivations();
		return apiSuccess(activations);
	} catch (caughtError) {
		console.error("getSkinActivations failed", caughtError);
		return apiError("No se pudieron leer los temas. ¿Está aplicada la migración 0036?", 500);
	}
}

export async function POST(request: Request) {
	const owner = await requireOwner(request);
	if (!owner) return apiError("Solo el owner puede administrar temas", 403);

	const parsed = ActivationFormSchema.safeParse(await request.json());
	if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? "Datos inválidos", 400);

	try {
		const created = await createSkinActivation(parsed.data);
		return apiSuccess(created, 201);
	} catch (caughtError) {
		console.error("createSkinActivation failed", caughtError);
		return apiError("No se pudo programar el tema", 500);
	}
}
