/**
 * /admin/organizacion/sorteo — tab Sorteo por defecto (docs/ORG-PROFILE-HUB.md Q5).
 */

import { redirect } from "next/navigation";
import { findOrganizationSchedulingConfig } from "@/entities/organization-scheduling-config/queries";
import { ORGANIZATION_SCHEDULING_CONFIG_DEFAULTS } from "@/entities/organization-scheduling-config";
import { SorteoTab } from "@/features/organization-scheduling";
import { resolveHubOrg } from "../resolve-org";
import { OrgHubShell } from "../OrgHubShell";
import { OrgPicker } from "../OrgPicker";

type Props = { searchParams: Promise<{ org?: string }> };

export default async function OrgSorteoPage({ searchParams }: Props) {
	const { org: orgSlug } = await searchParams;
	const { user, org } = await resolveHubOrg(orgSlug);

	if (!org) {
		if (user.role === "owner") return <OrgPicker />;
		redirect("/admin");
	}

	const config = await findOrganizationSchedulingConfig(org.id);

	return (
		<OrgHubShell org={org} isOwner={user.role === "owner"}>
			<SorteoTab
				organizationId={org.id}
				initialData={config ?? ORGANIZATION_SCHEDULING_CONFIG_DEFAULTS(org.id)}
			/>
		</OrgHubShell>
	);
}
