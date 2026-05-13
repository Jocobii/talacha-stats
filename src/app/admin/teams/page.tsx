/**
 * /admin/teams — Lista de equipos filtrable por liga
 *
 * Server Component. Carga ligas y equipos directamente desde DB.
 * El filtro de liga funciona via URL param (leagueId).
 * La fusión de duplicados es una acción secundaria en TeamsTable.
 */

import { redirect } from "next/navigation";
import { eq, sql } from "drizzle-orm";
import { db, leagues, teams, leagueMembers, inscriptions } from "@/db";
import { getSessionUser } from "@/shared/lib/auth";
import { LeagueFilter } from "./LeagueFilter";
import { TeamsTable } from "./TeamsTable";
import type { LeagueOption } from "./LeagueFilter";
import type { TeamRow } from "./TeamsTable";
import { buildPagination, DEFAULT_PAGE_SIZE } from "@/shared/ui/admin-table.helpers";

// ── Página principal ──────────────────────────────────────────────────────────

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

	// ── Ligas disponibles (scoped a org para organizers) ─────────────────────
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

	// ── Equipos (solo si hay liga seleccionada) ───────────────────────────────
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
		<div className="max-w-3xl space-y-5">
			{/* Header */}
			<div>
				<h1 className="text-2xl font-bold text-ink">Equipos</h1>
				<p className="text-sm text-ink-2 mt-0.5">Selecciona una liga para ver sus equipos.</p>
			</div>

			{/* Filtro de liga */}
			<LeagueFilter leagues={leagueOptions} selectedId={leagueId} />

			{/* Contenido */}
			{!leagueId ? (
				<div className="bg-surface rounded-xl shadow p-10 text-center text-sm text-ink-3">
					Selecciona una liga para ver sus equipos.
				</div>
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
									— {total} equipo{total !== 1 ? "s" : ""}
								</span>
							)}
						</p>
					)}

					<TeamsTable
						rows={teamRows}
						leagueId={leagueId}
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
