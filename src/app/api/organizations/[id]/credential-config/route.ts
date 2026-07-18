/**
 * GET   /api/organizations/[id]/credential-config — lee qué modalidades de
 *   pase (single_league / organization) puede emitir la organización, con
 *   default "ambas" si nunca se configuró (docs/CREDENCIAL-PASE-JUGADOR.md).
 * PATCH /api/organizations/[id]/credential-config — la edita. Al menos una
 *   modalidad debe quedar habilitada (chk_credential_config_at_least_one).
 */

import { apiSuccess, apiError } from "@/types";
import { getSessionUserFromRequest, canManageOrganization } from "@/shared/lib/auth";
import { UpdateOrganizationCredentialConfigSchema } from "@/entities/organization-credential-config";
import {
	getOrganizationCredentialConfig,
	updateOrganizationCredentialConfig,
} from "@/features/organization-credential-config/config";

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

	return apiSuccess(await getOrganizationCredentialConfig(id));
}

export async function PATCH(request: Request, { params }: Params) {
	const { id } = await params;
	const { error } = await guard(request, id);
	if (error) return error;

	const body = await request.json().catch(() => null);
	const parsed = UpdateOrganizationCredentialConfigSchema.safeParse(body);
	if (!parsed.success) return apiError(parsed.error.message, 400);

	try {
		const config = await updateOrganizationCredentialConfig(id, parsed.data);
		return apiSuccess(config);
	} catch (err: unknown) {
		const msg = err instanceof Error ? err.message : String(err);
		if (msg.includes("chk_credential_config_at_least_one")) {
			return apiError("Debe permitir al menos una modalidad de pase", 400);
		}
		console.error("[PATCH credential-config] Error inesperado:", err);
		return apiError("No se pudo actualizar la configuración", 500);
	}
}
