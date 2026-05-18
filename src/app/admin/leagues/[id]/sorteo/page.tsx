/**
 * Server Component — Cockpit del módulo de sorteo.
 */
import { redirect, notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { getSessionUser } from "@/shared/lib/auth";
import { db } from "@/db";
import { leagues } from "@/db/schema";
import { CockpitPage } from "@/features/sorteo-cockpit";

export const metadata = { title: "Sorteo · TalachaStats" };

type Params = { params: Promise<{ id: string }> };

export default async function SorteoPage({ params }: Params) {
	const [user, { id }] = await Promise.all([getSessionUser(), params]);
	if (!user) redirect("/login");

	const league = await db.query.leagues.findFirst({
		where: eq(leagues.id, id),
		columns: { id: true, name: true, organizationId: true, schedulingEnabled: true },
	});
	if (!league) notFound();

	const canManage =
		user.role === "owner" ||
		(user.role === "organizer" && user.organizationId === league.organizationId);
	if (!canManage) redirect("/admin/leagues");

	if (!league.schedulingEnabled) {
		redirect(`/admin/leagues/${id}`);
	}

	// Wrapper height:100% propaga la altura del main.flex-1 hasta CockpitPage
	return (
		<div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
			<CockpitPage leagueId={id} leagueName={league.name} />
		</div>
	);
}
