/**
 * /admin/organizacion/canchas — tab Canchas del hub (docs/ORG-PROFILE-HUB.md
 * R1). Consolida el inventario de `venues` en el hub — reusa CanchasClient
 * tal cual (mismo componente que antes vivía en /admin/canchas, ahora un
 * redirect hacia aquí). El inventario de venues ya era org-level por diseño
 * (§1 del doc); esto solo le da un único punto de entrada.
 *
 * Fuera de alcance de este paso: leagues/[id]/canchas y
 * leagues/[id]/sorteo/canchas (asignación de canchas a una liga + horarios)
 * siguen siendo pantallas separadas — convertirlas en un simple selector
 * contra este inventario es refactor aparte (doc §6 D-3, memoria
 * `duplicate-canchas-windows-ui`).
 */

import { redirect } from "next/navigation";
import { listVenuesWithStats } from "@/entities/venue";
import { resolveHubOrg } from "../resolve-org";
import { OrgHubShell } from "../OrgHubShell";
import { OrgPicker } from "../OrgPicker";
import { CanchasClient } from "../../canchas/CanchasClient";

type Props = { searchParams: Promise<{ org?: string }> };

export default async function OrgCanchasPage({ searchParams }: Props) {
	const { org: orgSlug } = await searchParams;
	const { user, org } = await resolveHubOrg(orgSlug);

	if (!org) {
		if (user.role === "owner") return <OrgPicker />;
		redirect("/admin");
	}

	const venues = await listVenuesWithStats(org.id);

	return (
		<OrgHubShell org={org} isOwner={user.role === "owner"}>
			<CanchasClient venues={venues} organizationId={org.id} />
		</OrgHubShell>
	);
}
