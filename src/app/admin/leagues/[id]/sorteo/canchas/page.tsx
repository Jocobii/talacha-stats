/**
 * /admin/leagues/[id]/sorteo/canchas
 * Asignación de canchas a la liga y configuración de ventanas horarias.
 * Server Component: auth + datos iniciales.
 */

import { redirect, notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { getSessionUser } from "@/shared/lib/auth";
import { db } from "@/db";
import { leagues, leagueSchedulingConfig } from "@/db/schema";
import { listVenuesByLeague, listUnassignedVenues } from "@/entities/venue";
import { LeagueVenuesClient } from "./LeagueVenuesClient";

export const metadata = { title: "Canchas de la liga · TalachaStats" };

type Params = { params: Promise<{ id: string }> };

export default async function LeagueVenuesPage({ params }: Params) {
	const [user, { id }] = await Promise.all([getSessionUser(), params]);
	if (!user) redirect("/login");

	const league = await db.query.leagues.findFirst({
		where: eq(leagues.id, id),
		columns: {
			id: true,
			name: true,
			season: true,
			organizationId: true,
			dayOfWeek: true,
			schedulingEnabled: true,
		},
	});
	if (!league) notFound();

	const canManage =
		user.role === "owner" ||
		(user.role === "organizer" && user.organizationId === league.organizationId);
	if (!canManage) redirect("/admin/leagues");

	const config = await db.query.leagueSchedulingConfig.findFirst({
		where: eq(leagueSchedulingConfig.leagueId, id),
		columns: { matchDurationMinutes: true, bufferMinutes: true },
	});

	const orgId = league.organizationId ?? user.organizationId ?? "";

	const [assigned, unassigned] = await Promise.all([
		listVenuesByLeague(id),
		listUnassignedVenues(orgId, id),
	]);

	const slotDuration = (config?.matchDurationMinutes ?? 50) + (config?.bufferMinutes ?? 0);

	return (
		<LeagueVenuesClient
			leagueId={id}
			leagueName={league.name}
			leagueSeason={league.season}
			dayOfWeek={league.dayOfWeek}
			slotDuration={slotDuration}
			initialAssigned={assigned}
			initialUnassigned={unassigned}
		/>
	);
}
