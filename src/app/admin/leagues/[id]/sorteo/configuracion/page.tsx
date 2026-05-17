/**
 * app/admin/leagues/[id]/sorteo/configuracion/page.tsx
 *
 * Server Component — Config del sorteo + descansos + horarios comprados.
 * T3.4: form de configuración (duración, buffer, jornadas).
 * T3.5: paneles de rest requests y purchased timeslots.
 */

import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { leagues } from "@/db/schema";
import { getSessionUser } from "@/shared/lib/auth";
import { getSchedulingConfig } from "@/features/scheduling/config/get-config";
import { listTeamsByLeague } from "@/entities/team";
import { listRestRequests } from "@/features/scheduling/rest/list-rest-requests";
import { listPurchasedSlots } from "@/features/scheduling/purchased/list-purchased-slots";
import { listVenuesByLeague } from "@/entities/venue";
import { SchedulingConfigForm } from "./SchedulingConfigForm";
import { RestRequestsPanel } from "./RestRequestsPanel";
import { PurchasedSlotsPanel } from "./PurchasedSlotsPanel";

export const metadata = { title: "Configuración del sorteo · TalachaStats" };

type Params = { params: Promise<{ id: string }> };

export default async function ConfiguracionPage({ params }: Params) {
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

	if (!league.schedulingEnabled) redirect(`/admin/leagues/${id}/sorteo`);

	const [config, teams, restRequests, purchasedSlots, leagueVenues] = await Promise.all([
		getSchedulingConfig(id),
		listTeamsByLeague(id),
		listRestRequests(id),
		listPurchasedSlots(id),
		listVenuesByLeague(id),
	]);

	return (
		<div>
			<div className="mb-6">
				<Link href={`/admin/leagues/${id}/sorteo`} className="text-sm text-ink-2 hover:underline">
					← Módulo de sorteo
				</Link>
				<h1 className="text-2xl font-bold text-ink mt-1">Configuración del sorteo</h1>
				<p className="text-ink-2 text-sm">
					{league.name} — {league.season}
				</p>
			</div>

			<div className="space-y-6">
				<SchedulingConfigForm
					leagueId={id}
					teamCount={teams.length}
					initialConfig={config ?? null}
				/>

				<RestRequestsPanel
					leagueId={id}
					teams={teams.map((t) => ({ id: t.id, name: t.name }))}
					initialRequests={restRequests}
					maxMatchday={config?.regularMatchdays ?? 20}
				/>

				<PurchasedSlotsPanel
					leagueId={id}
					teams={teams.map((t) => ({ id: t.id, name: t.name }))}
					venues={leagueVenues.map((v) => ({ id: v.id, name: v.name }))}
					initialSlots={purchasedSlots}
				/>
			</div>
		</div>
	);
}
