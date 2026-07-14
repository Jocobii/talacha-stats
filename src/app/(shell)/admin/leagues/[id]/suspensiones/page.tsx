/**
 * app/admin/leagues/[id]/suspensiones/page.tsx
 *
 * Tab "Suspensiones" — B7, §5.2 docs/MODULOS-GESTION-LIGA.md. Cabecera y tab
 * bar viven en el layout padre (leagues/[id]/layout.tsx); esta página baja
 * el listado + roster inicial (SSR→props, §7.3) y delega a <SuspensionsScreen>.
 */
import { redirect, notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { getSessionUser } from "@/shared/lib/auth";
import { db } from "@/db";
import { leagues } from "@/db/schema";
import {
	listRosterForLeague,
	listSuspensionsForLeague,
} from "@/features/discipline/manage-suspensions";
import { SuspensionsScreen } from "@/features/discipline";

export const metadata = { title: "Suspensiones · TalachaStats" };

type Params = { params: Promise<{ id: string }> };

export default async function SuspensionesPage({ params }: Params) {
	const [user, { id }] = await Promise.all([getSessionUser(), params]);
	if (!user) redirect("/login");

	const league = await db.query.leagues.findFirst({
		where: eq(leagues.id, id),
		columns: { id: true, name: true, organizationId: true },
	});
	if (!league) notFound();

	const canManage =
		user.role === "owner" ||
		(user.role === "organizer" && user.organizationId === league.organizationId);
	if (!canManage) redirect("/admin/leagues");

	const [suspensions, roster] = await Promise.all([
		listSuspensionsForLeague(id),
		listRosterForLeague(id),
	]);

	return (
		<SuspensionsScreen
			leagueId={id}
			leagueName={league.name}
			currentUserName={user.name}
			initialData={{ suspensions, roster }}
		/>
	);
}
