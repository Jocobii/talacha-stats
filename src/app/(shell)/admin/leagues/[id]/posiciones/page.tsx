/**
 * app/admin/leagues/[id]/posiciones/page.tsx
 *
 * Tab "Posiciones" — tabla de clasificación.
 * La cabecera y el tab bar viven en el layout padre (leagues/[id]/layout.tsx).
 *
 * Las cards de "Organización" y "Top goleadores" se quitaron de aquí
 * (decisión Jocobi, jul 2026): no le aportan nada al oficinista en esta
 * pantalla. Reasignar organización sigue disponible en el tab Configuración
 * (OrganizerSection ahí no se tocó).
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import { eq, asc } from "drizzle-orm";
import { serverFetch } from "@/shared/lib/server-fetch";
import { db } from "@/db";
import { leaguePlayoffZones, leagueVenues, teams } from "@/db/schema";
import { ShareStandingsButton } from "./ShareStandingsButton";
import { findZone, isZoneStart, getZoneTokens } from "@/shared/lib/zone-colors";
import type { ZoneInfo } from "@/shared/lib/zone-colors";
import LeagueEmptyState from "../LeagueEmptyState";

async function getLeagueData(id: string) {
	const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
	const [leagueRes, standingsRes] = await Promise.all([
		serverFetch(`${base}/api/leagues/${id}`, { cache: "no-store" }),
		serverFetch(`${base}/api/leagues/${id}/standings`, { cache: "no-store" }),
	]);

	if (!leagueRes.ok) return null;
	return {
		league: (await leagueRes.json()).data,
		standings: standingsRes.ok ? ((await standingsRes.json()).data?.standings ?? []) : [],
	};
}

type StandingRow = {
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
};

export default async function PosicionesPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const [data, zoneRows] = await Promise.all([
		getLeagueData(id),
		db.query.leaguePlayoffZones.findMany({
			where: eq(leaguePlayoffZones.leagueId, id),
			orderBy: [asc(leaguePlayoffZones.order), asc(leaguePlayoffZones.fromPosition)],
		}),
	]);
	if (!data) notFound();

	const { standings } = data;
	const isLeagueEmpty = standings.length === 0;
	const zones: ZoneInfo[] = zoneRows.map((z) => ({
		id: z.id,
		name: z.name,
		fromPosition: z.fromPosition,
		toPosition: z.toPosition,
		color: z.color,
	}));

	if (isLeagueEmpty) {
		// Checklist de arranque: cancha/horario y equipos son los dos requisitos
		// para que la liga pueda operar (sorteo, jornadas). Se resuelven aquí en
		// paralelo, no en LeagueEmptyState, que se queda puramente presentacional.
		const [venueAssigned, leagueTeams] = await Promise.all([
			db.query.leagueVenues.findFirst({
				where: eq(leagueVenues.leagueId, id),
				columns: { leagueId: true },
			}),
			db.query.teams.findMany({
				where: eq(teams.leagueId, id),
				columns: { id: true },
			}),
		]);

		return (
			<div className="bg-surface rounded-lg shadow overflow-hidden">
				<LeagueEmptyState
					leagueId={id}
					hasVenue={!!venueAssigned}
					teamsCount={leagueTeams.length}
				/>
			</div>
		);
	}

	return (
		<div>
			<div className="flex items-center justify-between mb-3">
				<h2 className="text-lg font-semibold text-ink">Tabla de posiciones</h2>
				<ShareStandingsButton leagueId={id} />
			</div>
			<div className="bg-surface rounded-lg shadow overflow-hidden">
				<div className="overflow-x-auto">
					<table className="w-full text-sm min-w-[560px]">
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
								{zones.length > 0 && <th className="px-3 py-2 text-left">Zona</th>}
							</tr>
						</thead>
						<tbody className="divide-y divide-line">
							{standings.map((s: StandingRow, i: number) => {
								const pos = i + 1;
								const zone = findZone(zones, pos);
								const tokens = zone ? getZoneTokens(zone.color) : null;
								const isFirst = isZoneStart(zone, pos);
								return (
									<tr
										key={s.teamId}
										className={`border-l-4 ${tokens ? `${tokens.leftBorder} ${tokens.rowBg}` : "border-l-transparent"} ${i === 0 && !zone ? "bg-brand/10" : "hover:bg-surface-2"}`}
									>
										<td className="px-3 py-2 text-ink-2">{pos}</td>
										<td className="px-3 py-2 font-medium text-ink">
											<Link
												href={`/admin/teams/${s.teamId}`}
												className="hover:underline hover:text-brand-ink"
											>
												{s.teamName}
											</Link>
										</td>
										<td className="px-3 py-2 text-center text-ink">{s.played}</td>
										<td className="px-3 py-2 text-center text-brand-ink">{s.wins}</td>
										<td className="px-3 py-2 text-center text-ink-2">{s.draws}</td>
										<td className="px-3 py-2 text-center text-red-500">{s.losses}</td>
										<td className="px-3 py-2 text-center text-ink">{s.goalsFor}</td>
										<td className="px-3 py-2 text-center text-ink">{s.goalsAgainst}</td>
										<td className="px-3 py-2 text-center text-ink">
											{s.goalDifference > 0 ? `+${s.goalDifference}` : s.goalDifference}
										</td>
										<td className="px-3 py-2 text-center font-bold text-ink">{s.points}</td>
										{zones.length > 0 && (
											<td className="px-3 py-2">
												{isFirst && tokens && zone && (
													<span
														className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded border ${tokens.badgeBg} ${tokens.badgeText} ${tokens.badgeBorder} whitespace-nowrap`}
													>
														{zone.name}
													</span>
												)}
											</td>
										)}
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}
