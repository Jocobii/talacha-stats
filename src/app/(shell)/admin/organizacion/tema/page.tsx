/**
 * /admin/organizacion/tema — identidad visual de la organización.
 *
 * - organizer: edita SU organización (la de su sesión).
 * - owner: edita cualquiera — vía ?org=<slug>, o elige de la lista.
 *   (El API route ya permite al owner editar cualquier org.)
 */

import { redirect } from "next/navigation";
import { OrgThemePanel } from "@/features/org-theming";
import { resolveHubOrg } from "../resolve-org";
import { OrgHubShell } from "../OrgHubShell";
import { OrgPicker } from "../OrgPicker";

type Props = { searchParams: Promise<{ org?: string }> };

export default async function OrgThemePage({ searchParams }: Props) {
	const { org: orgSlug } = await searchParams;
	const { user, org } = await resolveHubOrg(orgSlug);

	if (!org) {
		if (user.role === "owner") return <OrgPicker />;
		redirect("/admin");
	}

	return (
		<OrgHubShell org={org} isOwner={user.role === "owner"}>
			<div className="space-y-6">
				<p className="text-sm text-ink-2">
					Elige la paleta y tipografía de <span className="font-medium text-ink">{org.name}</span>.
					Se aplica a su página pública (/org/{org.slug}) y a las imágenes para compartir. Sin tema,
					se usa la paleta TalachaStats.
				</p>
				<OrgThemePanel organizationId={org.id} orgName={org.name} />
			</div>
		</OrgHubShell>
	);
}
