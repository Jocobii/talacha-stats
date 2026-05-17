/**
 * features/venue-calendar/get-venue-events.ts
 * Combina partidos de torneo + rentas de una cancha en un rango de fechas.
 * Devuelve VenueEvent[] ordenados por startAt.
 */

import { db } from "@/db";
import { matches, venueRentals } from "@/db/schema";
import { and, eq, gte, lte, isNotNull } from "drizzle-orm";
import type { VenueEvent } from "./types";

type Params = {
	venueId: string;
	start: Date;
	end: Date;
};

export async function getVenueEvents({ venueId, start, end }: Params): Promise<VenueEvent[]> {
	const [tournamentEvents, rentalEvents] = await Promise.all([
		fetchTournamentEvents(venueId, start, end),
		fetchRentalEvents(venueId, start, end),
	]);

	return [...tournamentEvents, ...rentalEvents].sort(
		(a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
	);
}

async function fetchTournamentEvents(
	venueId: string,
	start: Date,
	end: Date,
): Promise<VenueEvent[]> {
	const rows = await db.query.matches.findMany({
		where: and(
			eq(matches.venueId, venueId),
			isNotNull(matches.kickoffAt),
			gte(matches.kickoffAt, start),
			lte(matches.kickoffAt, end),
		),
		with: {
			homeTeam: { columns: { name: true } },
			awayTeam: { columns: { name: true } },
			matchday: {
				with: {
					league: { columns: { name: true } },
				},
			},
		},
	});

	return rows.map((m): VenueEvent => {
		const kickoff = m.kickoffAt!;
		const endTime = new Date(kickoff.getTime() + 60 * 60 * 1000); // fallback 1h si no hay config
		return {
			id: `tournament_${m.id}`,
			type: "tournament",
			title: m.matchday?.league?.name
				? `${m.matchday.league.name} — J${m.matchday?.number ?? ""}`
				: "Torneo",
			startAt: kickoff.toISOString(),
			endAt: endTime.toISOString(),
			venueId,
			leagueName: m.matchday?.league?.name ?? undefined,
			matchInfo: `${m.homeTeam.name} vs ${m.awayTeam.name}`,
		};
	});
}

async function fetchRentalEvents(venueId: string, start: Date, end: Date): Promise<VenueEvent[]> {
	const rows = await db
		.select()
		.from(venueRentals)
		.where(
			and(
				eq(venueRentals.venueId, venueId),
				gte(venueRentals.startAt, start),
				lte(venueRentals.startAt, end),
			),
		);

	return rows.map(
		(r): VenueEvent => ({
			id: r.id,
			type: `rental_${r.status}` as VenueEvent["type"],
			title: r.title,
			startAt: r.startAt.toISOString(),
			endAt: r.endAt.toISOString(),
			venueId: r.venueId,
			rentalId: r.id,
			clientName: r.title,
			price: r.price ? Number(r.price) : null,
			notes: r.notes ?? null,
			status: r.status,
		}),
	);
}
