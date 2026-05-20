/**
 * /admin/teams — Lista de equipos filtrable por liga
 *
 * Server Component. Carga ligas y equipos directamente desde DB.
 * El filtro de liga funciona via URL param (leagueId).
 */

import { redirect } from "next/navigation";
import { eq, sql } from "drizzle-orm";
import { Shield } from "lucide-react";
import { db, leagues, teams, inscriptions } from "@/db";
import { getSessionUser } from "@/shared/lib/auth";
import { LeagueFilter } from "./LeagueFilter";
import { TeamsTable } from "./TeamsTable";
import type { LeagueOption } from "./LeagueFilter";
import type { TeamRow } from "./TeamsTable";
import { buildPagination, DEFAULT_PAGE_SIZE } from "@/shared/ui/admin-table.helpers";

export default async function TeamsPage({
	searchParams,
}: {
	searchParams: Promise<Record<string, string>>;
}) {
	const [user, params] = await Promise.all([getSessionUser(), searchParams]);
	if (!user) redirect("/login");

	const leagueId = params.leagueId ?? "";
	const page = Math.max(1, Number(params.page ?? 1));
	const isOwner = user.role === "owner";

	const leagueRows = await db
		.select({
			id: leagues.id,
			name: leagues.name,
			season: leagues.season,
			dayOfWeek: leagues.dayOfWeek,
		})
		.from(leagues)
		.where(
			isOwner
				? undefined
				: user.organizationId
					? eq(leagues.organizationId, user.organizationId)
					: undefined,
		)
		.orderBy(leagues.name);

	const leagueOptions: LeagueOption[] = leagueRows.map((l) => ({
		id: l.id,
		name: l.name,
		season: l.season,
		dayOfWeek: l.dayOfWeek,
	}));

	let teamRows: TeamRow[] = [];
	let total = 0;

	if (leagueId) {
		const [rows, countResult] = await Promise.all([
			db
				.select({
					id: teams.id,
					name: teams.name,
					leagueId: teams.leagueId,
					playerCount: sql<number>`COUNT(DISTINCT ${inscriptions.leagueMemberId})::int`,
				})
				.from(teams)
				.leftJoin(inscriptions, eq(inscriptions.teamId, teams.id))
				.where(eq(teams.leagueId, leagueId))
				.groupBy(teams.id)
				.orderBy(teams.name)
				.limit(DEFAULT_PAGE_SIZE)
				.offset((page - 1) * DEFAULT_PAGE_SIZE),

			db
				.select({ total: sql<number>`COUNT(*)::int` })
				.from(teams)
				.where(eq(teams.leagueId, leagueId)),
		]);

		teamRows = rows.map((r) => ({
			id: r.id,
			name: r.name,
			leagueId: r.leagueId,
			playerCount: r.playerCount,
		}));
		total = countResult[0]?.total ?? 0;
	}

	const selectedLeague = leagueOptions.find((l) => l.id === leagueId);

	return (
		<div className="space-y-5">
			{/* Header */}
			<div>
				<h1 className="text-2xl font-bold text-ink">Equipos</h1>
				<p className="text-sm text-ink-2 mt-0.5">Gestiona los equipos de cada liga.</p>
			</div>

			{/* Filtro de liga */}
			<LeagueFilter leagues={leagueOptions} selectedId={leagueId} />

			{/* Contenido */}
			{!leagueId ? (
				<NoLeagueSelected />
			) : (
				<>
					{selectedLeague && (
						<p className="text-sm text-ink-2">
							<span className="font-medium text-ink">{selectedLeague.name}</span>
							{" · "}
							{selectedLeague.season}
							{" · "}
							<span className="capitalize">{selectedLeague.dayOfWeek}</span>
							{total > 0 && (
								<span className="text-ink-3 ml-2">
									({total} equipo{total !== 1 ? "s" : ""})
								</span>
							)}
						</p>
					)}

					<TeamsTable
						rows={teamRows}
						leagueId={leagueId}
						leagueName={selectedLeague?.name ?? ""}
						pagination={
							total > DEFAULT_PAGE_SIZE
								? buildPagination(page, total, "/admin/teams", {
										extraParams: { leagueId },
									})
								: undefined
						}
						emptyMessage="No hay equipos registrados en esta liga."
					/>
				</>
			)}
		</div>
	);
}

// Empty state: no league selected yet

function NoLeagueSelected() {
	return (
		<div className="bg-surface border border-line rounded-2xl p-12 flex flex-col items-center gap-4 text-center">
			<div className="w-16 h-16 rounded-2xl bg-surface-2 border border-line grid place-items-center">
				<Shield size={32} strokeWidth={1.5} className="text-ink-3" />
			</div>
			<div>
				<p className="text-[15px] font-semibold text-ink">Selecciona una liga</p>
				<p className="text-[13px] text-ink-3 mt-1 max-w-xs">
					Elige una liga en el selector de arriba para ver y gestionar sus equipos.
				</p>
			</div>
		</div>
	);
}
