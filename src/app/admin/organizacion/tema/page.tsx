/**
 * /admin/organizacion/tema — identidad visual de la organización.
 * Para el organizer de la org (el owner administra vía su propia org si
 * la tiene; la edición cross-org no está en alcance).
 */

import { redirect } from "next/navigation";
import { getOrganizationById } from "@/entities/organization";
import { OrgThemePanel } from "@/features/org-theming";
import { getSessionUser } from "@/shared/lib/auth";

export default async function OrgThemePage() {
	const user = await getSessionUser();
	if (!user) redirect("/login");
	if (!user.organizationId) redirect("/admin");

	const org = await getOrganizationById(user.organizationId);
	if (!org) redirect("/admin");

	return (
		<div className="p-6 space-y-6">
			<header>
				<h1 className="text-2xl font-semibold text-ink">Identidad visual</h1>
				<p className="text-sm text-ink-2 mt-1">
					Elige la paleta y tipografía de <span className="font-medium">{org.name}</span>. Se aplica
					a tu página pública (/org/{org.slug}) y a las imágenes para compartir. Sin tema, se usa la
					paleta TalachaStats.
				</p>
			</header>
			<OrgThemePanel organizationId={org.id} orgName={org.name} />
		</div>
	);
}
