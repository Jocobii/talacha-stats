/**
 * /admin/organizacion/reglamento — tab Reglamento por defecto (docs/ORG-PROFILE-HUB.md P3).
 */

import { redirect } from "next/navigation";
import { getOrganizationRules } from "@/features/organization-rules/rules";
import { mapOrganizationConfigToRulesView, ReglamentoTab } from "@/features/organization-rules";
import { resolveHubOrg } from "../resolve-org";
import { OrgHubShell } from "../OrgHubShell";
import { OrgPicker } from "../OrgPicker";

type Props = { searchParams: Promise<{ org?: string }> };

export default async function OrgReglamentoPage({ searchParams }: Props) {
	const { org: orgSlug } = await searchParams;
	const { user, org } = await resolveHubOrg(orgSlug);

	if (!org) {
		if (user.role === "owner") return <OrgPicker />;
		redirect("/admin");
	}

	const config = await getOrganizationRules(org.id);

	return (
		<OrgHubShell org={org} isOwner={user.role === "owner"}>
			<ReglamentoTab
				organizationId={org.id}
				initialView={mapOrganizationConfigToRulesView(config)}
			/>
		</OrgHubShell>
	);
}
