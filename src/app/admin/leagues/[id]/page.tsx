import Link from "next/link";
import { notFound } from "next/navigation";
import { serverFetch } from "@/shared/lib/server-fetch";
import { getSessionUser } from "@/shared/lib/auth";
import { listOrganizations } from "@/entities/organization";
import OrganizationSection from "./OrganizerSection";
import NewSeasonButton from "./NewSeasonButton";
import ShareButton from "@/shared/ui/ShareButton";
import LeagueEmptyState from "./LeagueEmptyState";

async function getLeagueData(id: string) {
	const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
	const [leagueRes, standingsRes, scorersRes] = await Promise.all([
		serverFetch(`${base}/api/leagues/${id}`, { cache: "no-store" }),
		serverFetch(`${base}/api/leagues/${id}/standings`, { cache: "no-store" }),
		serverFetch(`${base}/api/leagues/${id}/top-scorers?limit=5`, { cache: "no-store" }),
	]);

	if (!leagueRes.ok) return null;
	return {
		league: (await leagueRes.json()).data,
		standings: standingsRes.ok ? ((await standingsRes.json()).data?.standings ?? []) : [],
		topScorers: scorersRes.ok ? ((await scorersRes.json()).data ?? []) : [],
	};
}

export default async function LeaguePage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const [data, session] = await Promise.all([getLeagueData(id), getSessionUser()]);
	if (!data) notFound();

	const { league, standings, topScorers } = data;
	const isOwner = session?.role === "owner";

	const isLeagueEmpty = standings.length === 0 && topScorers.length === 0;

	// Solo el owner puede reasignar la org de una liga
	const allOrganizations = isOwner ? await listOrganizations() : [];

	return (
		<div>
			<div className="mb-6">
				<Link href="/admin" className="text-sm text-ink-2 hover:underline">
					← Dashboard
				</Link>
				<div className="flex items-start justify-between gap-4 mt-1">
					<div>
						<h1 className="text-2xl font-bold text-ink">{league.name}</h1>
						<p className="text-ink-2 capitalize">
							{league.dayOfWeek} — {league.season}
							{league.organization && (
								<span className="ml-2 text-xs bg-surface-2 text-ink-2 px-2 py-0.5 rounded-full">
									{league.organization.name}
								</span>
							)}
						</p>
					</div>
					<NewSeasonButton
						leagueId={id}
						leagueName={league.name}
						dayOfWeek={league.dayOfWeek}
						organizationId={league.organizationId ?? null}
					/>
					<ShareButton
						title={league.name}
						variant="icon"
						url={`${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/org/${league.organization?.slug ?? ""}/${league.slug ?? ""}`}
					/>
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Tabla de posiciones / Empty state */}
				<div className="lg:col-span-2">
					{isLeagueEmpty ? (
						<div className="bg-surface rounded-lg shadow overflow-hidden">
							<LeagueEmptyState />
						</div>
					) : (
						<>
							<h2 className="text-lg font-semibold text-ink mb-3">Tabla de posiciones</h2>
							<div className="bg-surface rounded-lg shadow overflow-hidden">
								<table className="w-full text-sm">
									<thead className="bg-surface-2 text-ink-2 uppercase text-xs">
										<tr>
											<th className="px-3 py-2 text-left">#</th>
											<th className="px-3 py-2 text-left">Equipo</th>
											<th className="px-3 py-2 text-center">PJ</th>
											<th className="px-3 py-2 text-center">G</th>
											<th className="px-3 py-2 text-center">E</th>
											<th className="px-3 py-2 text-center">P</th>
											<th className="px-3 py-2 text-center">GF</th>
											<th className="px-3 py-2 text-center">GC</th>
											<th className="px-3 py-2 text-center">DG</th>
											<th className="px-3 py-2 text-center font-bold">Pts</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-line">
										{standings.map(
											(
												s: {
													teamId: string;
													teamName: string;
													played: number;
													wins: number;
													draws: number;
													losses: number;
													goalsFor: number;
													goalsAgainst: number;
													goalDifference: number;
													points: number;
												},
												i: number,
											) => (
												<tr
													key={s.teamId}
													className={i === 0 ? "bg-brand/10" : "hover:bg-surface-2"}
												>
													<td className="px-3 py-2 text-ink-2">{i + 1}</td>
													<td className="px-3 py-2 font-medium text-ink">{s.teamName}</td>
													<td className="px-3 py-2 text-center">{s.played}</td>
													<td className="px-3 py-2 text-center text-brand">{s.wins}</td>
													<td className="px-3 py-2 text-center text-ink-2">{s.draws}</td>
													<td className="px-3 py-2 text-center text-red-500">{s.losses}</td>
													<td className="px-3 py-2 text-center">{s.goalsFor}</td>
													<td className="px-3 py-2 text-center">{s.goalsAgainst}</td>
													<td className="px-3 py-2 text-center">
														{s.goalDifference > 0 ? `+${s.goalDifference}` : s.goalDifference}
													</td>
													<td className="px-3 py-2 text-center font-bold text-ink">{s.points}</td>
												</tr>
											),
										)}
									</tbody>
								</table>
							</div>
						</>
					)}
				</div>

				{/* Sidebar */}
				<div className="space-y-6">
					<OrganizationSection
						leagueId={id}
						current={league.organization ?? null}
						organizations={allOrganizations}
						isOwner={isOwner ?? false}
					/>

					<div>
						<h2 className="text-lg font-semibold text-ink mb-3">Top goleadores</h2>
						<div className="bg-surface rounded-lg shadow p-4 space-y-2">
							{topScorers.map(
								(
									s: {
										playerId: string;
										fullName: string;
										alias: string | null;
										teamName: string;
										goals: number;
									},
									i: number,
								) => (
									<div key={s.playerId} className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<span className="text-xs text-ink-3 w-4">{i + 1}</span>
											<div>
												<Link
													href={`/admin/players/${s.playerId}`}
													className="text-sm font-medium text-ink hover:underline"
												>
													{s.alias ?? s.fullName}
												</Link>
												<p className="text-xs text-ink-3">{s.teamName}</p>
											</div>
										</div>
										<span className="font-bold text-brand">{s.goals} ⚽</span>
									</div>
								),
							)}
							{topScorers.length === 0 && (
								<div className="text-center py-4">
									<p className="text-sm text-ink-3">Sin goleadores aún.</p>
									{!isLeagueEmpty && (
										<Link
											href="/admin/imports"
											className="text-xs text-brand hover:underline mt-1 inline-block"
										>
											Importar estadísticas →
										</Link>
									)}
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
