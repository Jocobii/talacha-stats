/**
 * app/admin/leagues/[id]/sorteo/sortear/page.tsx
 *
 * Server Component — Página de generación y confirmación del sorteo.
 * T4.7: Preview del sorteo + confirmación.
 */

import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { leagues } from "@/db/schema";
import { getSessionUser } from "@/shared/lib/auth";
import { getSchedulingConfig } from "@/features/scheduling/config/get-config";
import { listTeamsByLeague } from "@/entities/team";
import { SorteoWizard } from "./SorteoWizard";

export const metadata = { title: "Hacer sorteo · TalachaStats" };

type Params = { params: Promise<{ id: string }> };

export default async function SortearPage({ params }: Params) {
	const [user, { id }] = await Promise.all([getSessionUser(), params]);
	if (!user) redirect("/login");

	const league = await db.query.leagues.findFirst({
		where: eq(leagues.id, id),
		columns: {
			id: true,
			name: true,
			season: true,
			dayOfWeek: true,
			organizationId: true,
			schedulingEnabled: true,
		},
	});
	if (!league) notFound();

	const canManage =
		user.role === "owner" ||
		(user.role === "organizer" && user.organizationId === league.organizationId);
	if (!canManage) redirect("/admin/leagues");
	if (!league.schedulingEnabled) redirect(`/admin/leagues/${id}/sorteo`);

	const [config, teams] = await Promise.all([getSchedulingConfig(id), listTeamsByLeague(id)]);

	const today = new Date();
	const defaultDate = today.toISOString().slice(0, 10);
	const teamMap = Object.fromEntries(teams.map((t) => [t.id, t.name]));

	return (
		<div>
			<div className="mb-6">
				<Link href={`/admin/leagues/${id}/sorteo`} className="text-sm text-ink-2 hover:underline">
					← Módulo de sorteo
				</Link>
				<h1 className="text-2xl font-bold text-ink mt-1">Hacer sorteo</h1>
				<p className="text-ink-2 text-sm">
					{league.name} — {league.season}
				</p>
			</div>

			{!config ? (
				<div className="bg-amber-50 border border-amber-200 rounded-lg p-5 text-sm text-amber-800">
					Configura los parámetros del sorteo antes de generar el calendario.{" "}
					<Link
						href={`/admin/leagues/${id}/sorteo/configuracion`}
						className="underline font-medium"
					>
						Ir a configuración →
					</Link>
				</div>
			) : (
				<SorteoWizard
					leagueId={id}
					defaultStartDate={defaultDate}
					calendarHref={`/admin/leagues/${id}/sorteo/calendario`}
					teamMap={teamMap}
					config={{
						regularMatchdays: config.regularMatchdays,
						matchDurationMinutes: config.matchDurationMinutes,
						bufferMinutes: config.bufferMinutes,
					}}
				/>
			)}
		</div>
	);
}
