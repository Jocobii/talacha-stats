/**
 * app/admin/leagues/[id]/sorteo/canchas/page.tsx
 *
 * Server Component — Gestión de canchas para el sorteo de una liga.
 * T2.4: CRUD de venues de la org + asignación a la liga + ventanas horarias.
 */

import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { leagues } from "@/db/schema";
import { getSessionUser } from "@/shared/lib/auth";
import { listVenuesByOrganization, listVenuesByLeague } from "@/entities/venue";
import { VenuesPanel } from "./VenuesPanel";

export const metadata = { title: "Canchas · Sorteo · TalachaStats" };

type Params = { params: Promise<{ id: string }> };

export default async function CanchasPage({ params }: Params) {
	const [user, { id }] = await Promise.all([getSessionUser(), params]);
	if (!user) redirect("/login");

	const league = await db.query.leagues.findFirst({
		where: eq(leagues.id, id),
		columns: { id: true, name: true, season: true, organizationId: true, schedulingEnabled: true },
	});
	if (!league) notFound();

	const canManage =
		user.role === "owner" ||
		(user.role === "organizer" && user.organizationId === league.organizationId);
	if (!canManage) redirect("/admin/leagues");

	if (!league.organizationId) {
		return (
			<div className="py-8 text-center text-ink-2 text-sm">
				Esta liga no tiene organización asignada.
			</div>
		);
	}

	const [orgVenues, leagueVenues] = await Promise.all([
		listVenuesByOrganization(league.organizationId),
		listVenuesByLeague(id),
	]);

	return (
		<div>
			<div className="mb-6">
				<Link href={`/admin/leagues/${id}/sorteo`} className="text-sm text-ink-2 hover:underline">
					← Módulo de sorteo
				</Link>
				<h1 className="text-2xl font-bold text-ink mt-1">Canchas</h1>
				<p className="text-ink-2 text-sm">
					{league.name} — {league.season}
				</p>
			</div>
			<VenuesPanel
				leagueId={id}
				organizationId={league.organizationId}
				initialOrgVenues={orgVenues}
				initialLeagueVenues={leagueVenues}
			/>
		</div>
	);
}
