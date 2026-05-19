/**
 * app/admin/leagues/[id]/calendario/page.tsx
 *
 * Tab "Calendario" — vista de jornadas confirmadas.
 * La cabecera y el tab bar viven en el layout padre (leagues/[id]/layout.tsx).
 */

import { redirect, notFound } from "next/navigation";
import { eq, asc, desc } from "drizzle-orm";
import { CalendarX } from "lucide-react";
import Link from "next/link";
import { db } from "@/db";
import { leagues, matchdays, matches } from "@/db/schema";
import { getSessionUser } from "@/shared/lib/auth";
import { MatchdayCard } from "./MatchdayCard";
import type { MatchdayWithMatches } from "./MatchdayCard";

export const metadata = { title: "Calendario · TalachaStats" };

type Params = { params: Promise<{ id: string }> };

async function fetchCalendar(leagueId: string): Promise<MatchdayWithMatches[]> {
	const mdRows = await db.query.matchdays.findMany({
		where: eq(matchdays.leagueId, leagueId),
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

	const calendar = await fetchCalendar(id);
	const regularJornadas = calendar.filter((md) => md.phase === "regular");
	const makeupJornadas = calendar.filter((md) => md.phase !== "regular");

	if (calendar.length === 0) {
		return (
			<div className="bg-surface rounded-lg shadow p-10 text-center space-y-3">
				<CalendarX className="mx-auto text-ink-3" size={36} />
				<p className="text-ink-2 text-sm">Aún no hay calendario confirmado para esta liga.</p>
				<Link
					href={`/admin/leagues/${id}/sorteo`}
					className="inline-block text-sm text-brand hover:underline font-medium"
				>
					Hacer el sorteo →
				</Link>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{regularJornadas.map((md) => (
				<MatchdayCard key={md.id} md={md} />
			))}
			{makeupJornadas.length > 0 && (
				<>
					<h2 className="text-sm font-semibold text-ink-2 uppercase tracking-wide mt-6">
						Jornadas de recuperación
					</h2>
					{makeupJornadas.map((md) => (
						<MatchdayCard key={md.id} md={md} isExtra />
					))}
				</>
			)}
		</div>
	);
}
