import Link from "next/link";
import { notFound } from "next/navigation";
import { serverFetch } from "@/shared/lib/server-fetch";
import { getSessionUser } from "@/shared/lib/auth";
import { listOrganizations } from "@/entities/organization";
import OrganizationSection from "./OrganizerSection";
import NewSeasonButton from "./NewSeasonButton";
import ShareButton from "@/shared/ui/ShareButton";

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
				{/* Tabla de posiciones */}
				<div className="lg:col-span-2">
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
										<tr key={s.teamId} className={i === 0 ? "bg-brand/10" : "hover:bg-surface-2"}>
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
							{topScorers.length === 0 && <p className="text-sm text-ink-3">Sin datos.</p>}
						</div>
					</div>

					{/* Partidos recientes */}
					<div>
						<div className="flex items-center justify-between mb-3">
							<h2 className="text-lg font-semibold text-ink">Partidos</h2>
							<Link href="#" className="text-sm text-brand hover:underline">
								Ver todos
							</Link>
						</div>
						<div className="space-y-2">
							{league.matches
								?.slice(0, 5)
								.map(
									(m: {
										id: string;
										matchday: number | null;
										matchDate: string;
										homeTeam: { name: string };
										awayTeam: { name: string };
										homeScore: number;
										awayScore: number;
										status: string;
									}) => (
										<Link
											key={m.id}
											href={`/admin/matches/${m.id}`}
											className="block bg-surface rounded-lg shadow p-3 hover:shadow-md transition"
										>
											<p className="text-xs text-ink-3 mb-1">
												J{m.matchday ?? "?"} · {m.matchDate}
												{m.status === "scheduled" && (
													<span className="ml-2 bg-yellow-100 text-yellow-300 px-1 rounded text-xs">
														Pendiente
													</span>
												)}
											</p>
											<div className="flex items-center justify-between text-sm font-medium text-ink">
												<span className="flex-1">{m.homeTeam.name}</span>
												<span className="px-3 font-bold">
													{m.status === "completed" ? `${m.homeScore} - ${m.awayScore}` : "vs"}
												</span>
												<span className="flex-1 text-right">{m.awayTeam.name}</span>
											</div>
										</Link>
									),
								)}
							{league.matches?.length === 0 && <p className="text-sm text-ink-3">Sin partidos.</p>}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
