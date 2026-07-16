/**
 * app/admin/organizacion/resolve-org.ts
 *
 * Resolución compartida de "la organización activa" para los tabs del hub
 * (organizer: la suya vía sesión · owner: ?org=<slug>). Se llama desde cada
 * page.tsx — NO desde un layout.tsx: Next.js no pasa `searchParams` a los
 * layouts (solo a pages/route handlers), así que un layout no puede leer
 * `?org=` sin usePathname/useSearchParams del lado cliente. Cada page.tsx sí
 * recibe `searchParams`, de ahí la duplicación (mismo patrón ya aceptado que
 * `leagues/[id]/layout.tsx` + sus pages, solo que aquí ni el layout puede
 * hacer la resolución).
 */

import { redirect } from "next/navigation";
import { getOrganizationById, getOrganizationBySlug } from "@/entities/organization";
import type { Organization } from "@/entities/organization";
import { getSessionUser, type SessionUser } from "@/shared/lib/auth";

export async function resolveHubOrg(
	orgSlug: string | undefined,
): Promise<{ user: SessionUser; org: Organization | null }> {
	const user = await getSessionUser();
	if (!user) redirect("/login");

	const org =
		user.role === "owner" && orgSlug
			? await getOrganizationBySlug(orgSlug)
			: user.organizationId
				? await getOrganizationById(user.organizationId)
				: null;

	return { user, org };
}
