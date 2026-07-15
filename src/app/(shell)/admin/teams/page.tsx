/**
 * /admin/teams — Lista de equipos
 *
 * Server Component "controlador delgado" (AGENTS.md §3.2/§3.7): resuelve la
 * sesión, decide qué vista renderizar según el rol, y delega TODA la carga
 * de datos a features/team-admin (que a su vez solo llama a entities/).
 * Cero acceso a @/db aquí — eso está prohibido en la capa app/.
 * Espejo de app/admin/players/page.tsx.
 */

import { redirect } from "next/navigation";
import { getSessionUser } from "@/shared/lib/auth";
import { getOwnerTeamsView, getOrgTeamsView } from "@/features/team-admin";
import { OwnerTeamsView } from "./OwnerTeamsView";
import { OrgTeamsView } from "./OrgTeamsView";
import { NoOrganizationView } from "./NoOrganizationView";

export default async function TeamsPage({
	searchParams,
}: {
	searchParams: Promise<Record<string, string>>;
}) {
	const [user, params] = await Promise.all([getSessionUser(), searchParams]);
	if (!user) redirect("/login");

	if (user.role === "owner") {
		const view = await getOwnerTeamsView(params);
		return <OwnerTeamsView {...view} />;
	}

	if (!user.organizationId) {
		return <NoOrganizationView />;
	}

	const view = await getOrgTeamsView(user.organizationId, params);
	return <OrgTeamsView {...view} />;
}
