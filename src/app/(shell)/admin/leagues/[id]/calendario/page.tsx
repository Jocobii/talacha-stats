/**
 * app/admin/leagues/[id]/calendario/page.tsx
 *
 * Tab "Calendario" — jornadas regulares + brackets de fase final.
 * La Fase Final aparece en la parte superior cuando ya fue iniciada.
 */

import { redirect, notFound } from "next/navigation";
import { eq, asc, desc, and } from "drizzle-orm"; // desc used in fetchCalendar orderBy
import { CalendarX } from "lucide-react";
import Link from "next/link";
import { db } from "@/db";
import {
	leagues,
	matchdays,
	matches,
	teams,
	playoffBrackets,
	leagueSchedulingConfig,
} from "@/db/schema";
import { getSessionUser } from "@/shared/lib/auth";
import { MatchdayCard } from "./MatchdayCard";
import type { MatchdayWithMatches } from "./MatchdayCard";
import { StartPlayoffsButton } from "./StartPlayoffsButton";
import { BracketView } from "./BracketView";
import type { BracketData } from "./BracketView";

export const metadata = { title: "Calendario · TalachaStats" };

type Params = { params: Promise<{ id: string }> };

async function fetchCalendar(leagueId: string): Promise<MatchdayWithMatches[]> {
	// Exclude the playoff sentinel matchday (number=0, phase=playoff) from regular calendar
	const mdRows = await db.query.matchdays.findMany({
		where: and(eq(matchdays.leagueId, leagueId), eq(matchdays.phase, "regular")),
		orderBy: [desc(matchdays.number)],
	});
	if (mdRows.length === 0) return [];

	const matchRows = await db.query.matches.findMany({
		where: eq(matches.leagueId, leagueId),
		with: {
			homeTeam: { columns: { name: true } },
			awayTeam: { columns: { name: true } },
			venue: { columns: { name: true } },
		},
		orderBy: [asc(matches.kickoffAt), asc(matches.matchDate)],
	});

	const byMatchday = new Map<string, MatchdayWithMatches["matches"]>();
	for (const m of matchRows) {
		if (!m.matchdayId) continue;
		if (!byMatchday.has(m.matchdayId)) byMatchday.set(m.matchdayId, []);
		byMatchday.get(m.matchdayId)!.push({
			id: m.id,
			homeTeamName: m.homeTeam.name,
			awayTeamName: m.awayTeam.name,
			venueName: m.venue?.name ?? null,
			kickoffAt: m.kickoffAt,
			matchDate: m.matchDate,
			status: m.status,
			isMakeup: m.isMakeup,
		});
	}

	return mdRows.map((md) => ({
		id: md.id,
		number: md.number,
		scheduledDate: md.scheduledDate,
		phase: md.phase,
		status: md.status,
		leagueId,
		matches: byMatchday.get(md.id) ?? [],
	}));
}

export default async function CalendarioPage({ params }: Params) {
	const [user, { id }] = await Promise.all([getSessionUser(), params]);
	if (!user) redirect("/login");

	const league = await db.query.leagues.findFirst({
		where: eq(leagues.id, id),
		columns: { id: true, name: true, season: true, organizationId: true },
	});
	if (!league) notFound();

	const canManage =
		user.role === "owner" ||
		(user.role === "organizer" && user.organizationId === league.organizationId);
	if (!canManage) redirect("/admin/leagues");

	const [calendar, bracketRows, teamRows, playoffMatchday, schedulingConfig] = await Promise.all([
		fetchCalendar(id),
		db.query.playoffBrackets.findMany({
			where: eq(playoffBrackets.leagueId, id),
			orderBy: [asc(playoffBrackets.createdAt)],
			with: {
				slots: {
					with: {
						homeTeam: { columns: { id: true, name: true } },
						awayTeam: { columns: { id: true, name: true } },
						winner: { columns: { id: true, name: true } },
					},
				},
			},
		}),
		db.query.teams.findMany({
			where: eq(teams.leagueId, id),
			columns: { id: true, name: true },
			orderBy: [asc(teams.name)],
		}),
		db.query.matchdays.findFirst({
			where: and(eq(matchdays.leagueId, id), eq(matchdays.phase, "playoff")),
			columns: { id: true },
		}),
		db.query.leagueSchedulingConfig.findFirst({
			where: eq(leagueSchedulingConfig.leagueId, id),
			columns: { regularMatchdays: true },
		}),
	]);

	const playoffStarted = bracketRows.length > 0;
	const playoffMatchdayId = playoffMatchday?.id ?? "";

	// Only show the "Iniciar Fase Final" button once ALL configured jornadas exist
	// AND are closed. Uses regularMatchdays from leagueSchedulingConfig as the ground truth.
	// If playoffs are already running, always show the bracket regardless.
	const configuredTotal = schedulingConfig?.regularMatchdays ?? 0;
	const completedCount = calendar.filter((md) => md.status === "completed").length;
	const allJornadasClosed =
		configuredTotal > 0 && calendar.length >= configuredTotal && completedCount >= configuredTotal;
	const showFaseFinal = playoffStarted || allJornadasClosed;

	const brackets: BracketData[] = bracketRows.map((b) => ({
		id: b.id,
		zoneName: b.zoneName,
		zoneColor: b.zoneColor,
		slots: b.slots
			.sort((a, b) => a.round - b.round || a.slotIndex - b.slotIndex)
			.map((s) => ({
				id: s.id,
				round: s.round,
				slotIndex: s.slotIndex,
				isThirdPlace: s.isThirdPlace,
				isBye: s.isBye,
				homeTeam: s.homeTeam ?? null,
				awayTeam: s.awayTeam ?? null,
				winner: s.winner ?? null,
				matchId: s.matchId,
			})),
	}));

	// fetchCalendar already filters to phase=regular; no further split needed

	if (calendar.length === 0 && !playoffStarted) {
		return (
			<div className="bg-surface rounded-lg shadow p-10 text-center space-y-3">
				<CalendarX className="mx-auto text-ink-3" size={36} />
				<p className="text-ink-2 text-sm">Aún no hay calendario confirmado para esta liga.</p>
				<Link
					href={`/admin/leagues/${id}/sorteo`}
					className="inline-block text-sm text-brand-ink hover:underline font-medium"
				>
					Hacer el sorteo →
				</Link>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{/* ── Fase Final — primero (solo cuando todas las jornadas están cerradas) ── */}
			{showFaseFinal && (
				<div>
					<h2 className="text-sm font-semibold text-ink-2 uppercase tracking-wide mb-3">
						Fase Final
					</h2>
					{playoffStarted ? (
						<BracketView
							brackets={brackets}
							leagueId={id}
							playoffMatchdayId={playoffMatchdayId}
							allTeams={teamRows}
						/>
					) : (
						<StartPlayoffsButton leagueId={id} />
					)}
				</div>
			)}

			{/* ── Jornadas regulares ───────────────────────────────────────────── */}
			{calendar.length > 0 && (
				<div>
					<h2 className="text-sm font-semibold text-ink-2 uppercase tracking-wide mt-2 mb-3">
						Temporada Regular
					</h2>
					<div className="space-y-4">
						{calendar.map((md) => (
							<MatchdayCard key={md.id} md={md} />
						))}
					</div>
				</div>
			)}
		</div>
	);
}
