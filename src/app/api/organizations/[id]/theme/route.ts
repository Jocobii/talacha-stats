/**
 * /api/organizations/[id]/theme — tema visual de la organización.
 * Controlador delgado (§3.2): auth → Zod → entities. Puede editarlo el
 * organizer de ESA organización o el owner.
 */

import { findOrgThemeByOrgId, upsertOrgTheme } from "@/entities/organization";
import { themeFormToRowValues } from "@/features/org-theming";
import { ThemeFormSchema } from "@/features/org-theming/model/theme-form-schema";
import { getSessionUserFromRequest, type SessionUser } from "@/shared/lib/auth";
import { apiError, apiSuccess } from "@/types";

type RouteContext = { params: Promise<{ id: string }> };

function canManageOrgTheme(user: SessionUser, organizationId: string): boolean {
	return user.role === "owner" || user.organizationId === organizationId;
}

export async function GET(request: Request, { params }: RouteContext) {
	const user = await getSessionUserFromRequest(request);
	if (!user) return apiError("No autenticado", 401);

	const { id } = await params;
	if (!canManageOrgTheme(user, id)) return apiError("Sin permiso", 403);

	try {
		const theme = await findOrgThemeByOrgId(id);
		return apiSuccess(theme);
	} catch (caughtError) {
		console.error("findOrgThemeByOrgId failed", caughtError);
		return apiError("No se pudo leer el tema", 500);
	}
}

export async function PUT(request: Request, { params }: RouteContext) {
	const user = await getSessionUserFromRequest(request);
	if (!user) return apiError("No autenticado", 401);

	const { id } = await params;
	if (!canManageOrgTheme(user, id)) return apiError("Sin permiso", 403);

	const parsed = ThemeFormSchema.safeParse(await request.json());
	if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? "Datos inválidos", 400);

	try {
		const saved = await upsertOrgTheme(id, themeFormToRowValues(parsed.data));
		return apiSuccess(saved);
	} catch (caughtError) {
		console.error("upsertOrgTheme failed", caughtError);
		return apiError("No se pudo guardar el tema. ¿Está aplicada la migración?", 500);
	}
}
