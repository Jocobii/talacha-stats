/**
 * /admin/players — Lista de jugadores
 *
 * Server Component "controlador delgado" (AGENTS.md §3.2/§3.7): resuelve la
 * sesión, decide qué vista renderizar según el rol, y delega TODA la carga
 * de datos a features/player-admin (que a su vez solo llama a entities/).
 * Cero acceso a @/db aquí — eso está prohibido en la capa app/.
 */

import { redirect } from "next/navigation";
import { getSessionUser } from "@/shared/lib/auth";
import { getOwnerPlayersView, getOrgPlayersView } from "@/features/player-admin";
import { getOrganizationCredentialConfig } from "@/features/organization-credential-config/config";
import { OwnerPlayersView } from "./OwnerPlayersView";
import { OrgPlayersView } from "./OrgPlayersView";
import { NoOrganizationView } from "./NoOrganizationView";

export default async function PlayersPage({
	searchParams,
}: {
	searchParams: Promise<Record<string, string>>;
}) {
	const [user, params] = await Promise.all([getSessionUser(), searchParams]);
	if (!user) redirect("/login");

	if (user.role === "owner") {
		const view = await getOwnerPlayersView(params);
		return <OwnerPlayersView {...view} />;
	}

	if (!user.organizationId) {
		return <NoOrganizationView />;
	}

	const [view, credentialConfig] = await Promise.all([
		getOrgPlayersView(user.organizationId, params),
		getOrganizationCredentialConfig(user.organizationId),
	]);
	return <OrgPlayersView {...view} credentialConfig={credentialConfig} />;
}
