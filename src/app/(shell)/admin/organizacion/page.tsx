/**
 * /admin/organizacion — tab General (docs/ORG-PROFILE-HUB.md O2).
 */

import { redirect } from "next/navigation";
import { GeneralTab } from "@/features/organization-profile";
import { resolveHubOrg } from "./resolve-org";
import { OrgHubShell } from "./OrgHubShell";
import { OrgPicker } from "./OrgPicker";

type Props = { searchParams: Promise<{ org?: string }> };

export default async function OrgGeneralPage({ searchParams }: Props) {
	const { org: orgSlug } = await searchParams;
	const { user, org } = await resolveHubOrg(orgSlug);

	if (!org) {
		if (user.role === "owner") return <OrgPicker />;
		redirect("/admin");
	}

	return (
		<OrgHubShell org={org} isOwner={user.role === "owner"}>
			<GeneralTab
				organizationId={org.id}
				initialData={{
					id: org.id,
					name: org.name,
					slug: org.slug,
					city: org.city,
					logoUrl: org.logoUrl ?? null,
				}}
			/>
		</OrgHubShell>
	);
}
