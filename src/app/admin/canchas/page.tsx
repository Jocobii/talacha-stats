/**
 * /admin/canchas — Pool global de canchas de la organización.
 * Server Component: auth + carga inicial de datos.
 */

import { redirect } from "next/navigation";
import { getSessionUser } from "@/shared/lib/auth";
import { listVenuesWithStats } from "@/entities/venue";
import { CanchasClient } from "./CanchasClient";

export const metadata = { title: "Canchas · TalachaStats" };

export default async function CanchasPage() {
	const user = await getSessionUser();
	if (!user) redirect("/login");

	const orgId = user.organizationId;
	if (!orgId) redirect("/admin");

	const venues = await listVenuesWithStats(orgId);

	return <CanchasClient venues={venues} organizationId={orgId} />;
}
