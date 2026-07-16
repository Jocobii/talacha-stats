/**
 * GET   /api/organizations/[id]/config — lee el reglamento por defecto de la
 *   organización (con defaults del sistema si nunca se configuró).
 * PATCH /api/organizations/[id]/config — lo edita. Nunca se congela
 *   (sin locked_at, docs/ORG-PROFILE-HUB.md §3) — a diferencia del reglamento
 *   de liga, esto es solo una plantilla que se copia al crear una liga.
 */

import { apiSuccess, apiError } from "@/types";
import { getSessionUserFromRequest, canManageOrganization } from "@/shared/lib/auth";
import { UpdateOrganizationConfigSchema } from "@/entities/organization-config";
import { getOrganizationRules, updateOrganizationRules } from "@/features/organization-rules/rules";

type Params = { params: Promise<{ id: string }> };

async function guard(request: Request, organizationId: string) {
	const session = await getSessionUserFromRequest(request);
	if (!session) return { error: apiError("No autenticado", 401) };
	if (!canManageOrganization(session, organizationId))
		return { error: apiError("Sin permiso", 403) };
	return { error: null };
}

export async function GET(request: Request, { params }: Params) {
	const { id } = await params;
	const { error } = await guard(request, id);
	if (error) return error;

	return apiSuccess(await getOrganizationRules(id));
}

export async function PATCH(request: Request, { params }: Params) {
	const { id } = await params;
	const { error } = await guard(request, id);
	if (error) return error;

	const body = await request.json().catch(() => null);
	const parsed = UpdateOrganizationConfigSchema.safeParse(body);
	if (!parsed.success) return apiError(parsed.error.message, 400);

	const config = await updateOrganizationRules(id, parsed.data);
	return apiSuccess(config);
}
