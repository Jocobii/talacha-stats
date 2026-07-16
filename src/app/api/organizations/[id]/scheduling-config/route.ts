/**
 * GET   /api/organizations/[id]/scheduling-config — lee el default de sorteo
 *   de la organización (o defaults del sistema si nunca se configuró).
 * PATCH /api/organizations/[id]/scheduling-config — lo edita. Nunca se
 *   congela — es una plantilla que se copia a league_scheduling_config al
 *   crear una liga (docs/ORG-PROFILE-HUB.md §3, Épica Q).
 */

import { apiSuccess, apiError } from "@/types";
import { getSessionUserFromRequest, canManageOrganization } from "@/shared/lib/auth";
import {
	UpdateOrganizationSchedulingConfigSchema,
	ORGANIZATION_SCHEDULING_CONFIG_DEFAULTS,
} from "@/entities/organization-scheduling-config";
import {
	findOrganizationSchedulingConfig,
	upsertOrganizationSchedulingConfig,
} from "@/entities/organization-scheduling-config/queries";

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

	const config = await findOrganizationSchedulingConfig(id);
	return apiSuccess(config ?? ORGANIZATION_SCHEDULING_CONFIG_DEFAULTS(id));
}

export async function PATCH(request: Request, { params }: Params) {
	const { id } = await params;
	const { error } = await guard(request, id);
	if (error) return error;

	const body = await request.json().catch(() => null);
	const parsed = UpdateOrganizationSchedulingConfigSchema.safeParse(body);
	if (!parsed.success) return apiError(parsed.error.message, 400);

	if (parsed.data.regularFormat === "double") {
		return apiError("El formato doble round-robin no está disponible en esta versión", 400);
	}

	const config = await upsertOrganizationSchedulingConfig(id, parsed.data);
	return apiSuccess(config);
}
