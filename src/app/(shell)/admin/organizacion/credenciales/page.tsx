/**
 * /admin/organizacion/credenciales — tab Credenciales (docs/CREDENCIAL-PASE-JUGADOR.md).
 * Calco de reglamento/page.tsx.
 */

import { redirect } from "next/navigation";
import { getOrganizationCredentialConfig } from "@/features/organization-credential-config/config";
import { CredencialesTab } from "@/features/organization-credential-config";
import { resolveHubOrg } from "../resolve-org";
import { OrgHubShell } from "../OrgHubShell";
import { OrgPicker } from "../OrgPicker";

type Props = { searchParams: Promise<{ org?: string }> };

export default async function OrgCredencialesPage({ searchParams }: Props) {
	const { org: orgSlug } = await searchParams;
	const { user, org } = await resolveHubOrg(orgSlug);

	if (!org) {
		if (user.role === "owner") return <OrgPicker />;
		redirect("/admin");
	}

	const config = await getOrganizationCredentialConfig(org.id);

	return (
		<OrgHubShell org={org} isOwner={user.role === "owner"}>
			<CredencialesTab organizationId={org.id} initialConfig={config} />
		</OrgHubShell>
	);
}
