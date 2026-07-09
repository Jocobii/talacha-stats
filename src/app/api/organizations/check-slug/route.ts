/**
 * GET /api/organizations/check-slug?slug=...
 *
 * Chequeo de disponibilidad en tiempo real del slug de organización, usado
 * por el paso "Identidad" del onboarding (debounce en cliente, ver
 * features/onboarding-wizard/model/useSlugAvailability.ts).
 *
 * El formato/reservados ya se validan en cliente y en CreateOrganizationSchema
 * al crear la org — este endpoint solo resuelve lo que el cliente no puede
 * saber solo: ¿ya existe una organización con ese slug?
 */

import { apiError, apiSuccess } from "@/types";
import { getSessionUserFromRequest } from "@/shared/lib/auth";
import { getOrganizationBySlug, type SlugAvailability } from "@/entities/organization";
import { validateOrgSlug } from "@/shared/org-theme";

export async function GET(request: Request) {
	const session = await getSessionUserFromRequest(request);
	if (!session) return apiError("No autenticado", 401);

	const slug = new URL(request.url).searchParams.get("slug")?.trim().toLowerCase() ?? "";

	const format = validateOrgSlug(slug);
	if (!format.ok) return apiSuccess<SlugAvailability>({ available: false });

	const existing = await getOrganizationBySlug(slug);
	return apiSuccess<SlugAvailability>({ available: !existing });
}
