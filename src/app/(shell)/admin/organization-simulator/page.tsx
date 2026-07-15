/**
 * /admin/organization-simulator — Épica E (docs/ORGANIZATION-SIMULATOR.md).
 * Sucesor de /admin/seed-liga: mismo layout de formulario, pero corre el
 * motor V2 completo (identidad global, estructura, cascada temporal) en vez
 * del seed V1 legacy. Solo rol "owner" — mismo criterio que /admin/temas.
 */

import { redirect } from "next/navigation";
import { getSessionUser } from "@/shared/lib/auth";
import { listOrganizations, listAllLeaguesWithTeamCount } from "@/entities/organization";
import OrganizationSimulatorForm from "./OrganizationSimulatorForm";

export default async function OrganizationSimulatorPage() {
	const user = await getSessionUser();
	if (!user) redirect("/login");
	if (user.role !== "owner") redirect("/admin");

	const [orgs, leagues] = await Promise.all([listOrganizations(), listAllLeaguesWithTeamCount()]);

	return (
		<OrganizationSimulatorForm
			organizations={orgs.map((o) => ({ id: o.id, name: o.name, slug: o.slug }))}
			leagues={leagues}
		/>
	);
}
