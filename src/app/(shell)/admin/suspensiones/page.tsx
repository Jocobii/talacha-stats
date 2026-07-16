/**
 * /admin/suspensiones — Lista de suspensiones (B7b)
 *
 * Server Component "controlador delgado" (AGENTS.md §3.2/§3.7): resuelve la
 * sesión, decide qué vista renderizar según el rol, y delega TODA la carga
 * de datos a features/discipline (que a su vez solo llama a entities/).
 * Cero acceso a @/db aquí — eso está prohibido en la capa app/.
 * Espejo de app/admin/players/page.tsx y app/admin/teams/page.tsx.
 */

import { redirect } from "next/navigation";
import { getSessionUser } from "@/shared/lib/auth";
import { getOwnerSuspensionsView, getOrgSuspensionsView } from "@/features/discipline";
import { OwnerSuspensionesView } from "./OwnerSuspensionesView";
import { OrgSuspensionesView } from "./OrgSuspensionesView";
import { NoOrganizationView } from "./NoOrganizationView";

export const metadata = { title: "Suspensiones · TalachaStats" };

export default async function SuspensionesPage({
	searchParams,
}: {
	searchParams: Promise<Record<string, string>>;
}) {
	const [user, params] = await Promise.all([getSessionUser(), searchParams]);
	if (!user) redirect("/login");

	if (user.role === "owner") {
		const view = await getOwnerSuspensionsView(params);
		return <OwnerSuspensionesView {...view} currentUserName={user.name} />;
	}

	if (!user.organizationId) {
		return <NoOrganizationView />;
	}

	const view = await getOrgSuspensionsView(user.organizationId, params);
	return <OrgSuspensionesView {...view} currentUserName={user.name} />;
}
