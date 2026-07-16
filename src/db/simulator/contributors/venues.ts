/**
 * src/db/simulator/contributors/venues.ts
 *
 * Contribuidor "venues" — ver docs/ORGANIZATION-SIMULATOR.md §5 (Épica B3).
 * Escribe: venues, venue_rentals, league_venues, venue_time_windows.
 * Depende de: identity (organizations), structure (leagues).
 *
 * Por organización crea un puñado de canchas, las asocia a sus ligas
 * (league_venues) con una ventana horaria en el día de la liga
 * (venue_time_windows), y agrega algunas rentas privadas sueltas
 * (venue_rentals) para que el cockpit de canchas tenga algo que mostrar.
 */

import { venues, venueRentals, leagueVenues, venueTimeWindows } from "@/db/schema";
import type {
	Venue,
	VenueRental,
	LeagueVenue,
	VenueTimeWindow,
	Organization,
	League,
} from "@/db/schema";
import { sanitizeToCanonical } from "@/shared/lib/normalize";
import { pick, pickN, rngInt, type Rng } from "../rng";
import { setData, requireData, type Contributor, type SimContext } from "../context";
import { getOrganizations } from "./identity";
import { getLeagues } from "./structure";

export const VENUES_KEY = "venues";
export const VENUE_RENTALS_KEY = "venueRentals";
export const LEAGUE_VENUES_KEY = "leagueVenues";
export const VENUE_TIME_WINDOWS_KEY = "venueTimeWindows";

const VENUE_NAME_POOL = [
	"Cancha Zona Río",
	"Complejo Deportivo La Mesa",
	"Unidad Deportiva Otay",
	"Cancha Cerro Colorado",
	"Complejo Playas",
	"Cancha El Florido",
	"Unidad Deportiva Independencia",
	"Cancha San Antonio",
	"Complejo Camino Verde",
	"Cancha Presidentes",
] as const;

const VENUE_COLOR_POOL = ["#60A5FA", "#F87171", "#34D399", "#FBBF24", "#A78BFA", "#22D3EE"];

const TIME_WINDOW_SLOTS = [
	{ startTime: "18:00", endTime: "19:40" },
	{ startTime: "19:40", endTime: "21:20" },
	{ startTime: "21:20", endTime: "23:00" },
] as const;

const RENTAL_TITLE_POOL = [
	"Renta privada — cumpleaños",
	"Torneo relámpago",
	"Renta privada — empresa",
	"Práctica libre",
	"Evento escolar",
] as const;

/** Canchas por organización — escala suave con el número de ligas. */
function venuesPerOrg(leaguesPerOrg: number): number {
	return Math.max(2, Math.ceil(leaguesPerOrg / 2) + 1);
}

async function fetchExistingVenueCanonicalsByOrg(
	ctx: SimContext,
): Promise<Map<string, Set<string>>> {
	const rows = await ctx.db
		.select({ organizationId: venues.organizationId, nameCanonical: venues.nameCanonical })
		.from(venues);
	const byOrg = new Map<string, Set<string>>();
	for (const row of rows as { organizationId: string; nameCanonical: string }[]) {
		const set = byOrg.get(row.organizationId) ?? new Set<string>();
		set.add(row.nameCanonical);
		byOrg.set(row.organizationId, set);
	}
	return byOrg;
}

async function createVenuesForOrg(
	ctx: SimContext,
	org: Organization,
	existingCanonicalsByOrg: Map<string, Set<string>>,
): Promise<Venue[]> {
	const count = Math.min(venuesPerOrg(ctx.params.leaguesPerOrg), VENUE_NAME_POOL.length);
	const existing = existingCanonicalsByOrg.get(org.id) ?? new Set<string>();

	const names = pickN(ctx.rng, VENUE_NAME_POOL, count).filter(
		(name) => !existing.has(sanitizeToCanonical(name)),
	);

	if (names.length === 0) return [];

	const rows = names.map((name) => ({
		name,
		nameCanonical: sanitizeToCanonical(name),
		organizationId: org.id,
		city: org.city,
		color: pick(ctx.rng, VENUE_COLOR_POOL),
		capacity: rngInt(ctx.rng, 1, 3),
	}));

	for (const row of rows) existing.add(row.nameCanonical);
	existingCanonicalsByOrg.set(org.id, existing);

	return ctx.db.insert(venues).values(rows).returning();
}

function assignVenuesToLeague(rng: Rng, orgVenues: Venue[], leagueId: string) {
	const count = Math.min(2, orgVenues.length);
	const chosen = pickN(rng, orgVenues, count);
	return chosen.map((venue, i) => ({ leagueId, venueId: venue.id, priority: i + 1 }));
}

async function createLeagueVenuesAndWindows(
	ctx: SimContext,
	leagueRows: League[],
	venuesByOrg: Map<string, Venue[]>,
): Promise<{ leagueVenueRows: LeagueVenue[]; timeWindowRows: VenueTimeWindow[] }> {
	const leagueVenueDefs: { leagueId: string; venueId: string; priority: number }[] = [];
	const timeWindowDefs: {
		leagueId: string;
		venueId: string;
		dayOfWeek: string;
		startTime: string;
		endTime: string;
	}[] = [];

	for (const league of leagueRows) {
		const orgVenues = league.organizationId ? (venuesByOrg.get(league.organizationId) ?? []) : [];
		if (orgVenues.length === 0) continue;

		const assignments = assignVenuesToLeague(ctx.rng, orgVenues, league.id);
		leagueVenueDefs.push(...assignments);

		// Al menos una ventana horaria en el día de la liga, en su cancha de mayor prioridad.
		const primary = assignments[0];
		const slot = pick(ctx.rng, TIME_WINDOW_SLOTS);
		timeWindowDefs.push({
			leagueId: league.id,
			venueId: primary.venueId,
			dayOfWeek: league.dayOfWeek,
			startTime: slot.startTime,
			endTime: slot.endTime,
		});
	}

	const leagueVenueRows =
		leagueVenueDefs.length > 0
			? await ctx.db.insert(leagueVenues).values(leagueVenueDefs).returning()
			: [];
	const timeWindowRows =
		timeWindowDefs.length > 0
			? await ctx.db.insert(venueTimeWindows).values(timeWindowDefs).returning()
			: [];

	return { leagueVenueRows, timeWindowRows };
}

async function createVenueRentals(ctx: SimContext, allVenues: Venue[]): Promise<VenueRental[]> {
	if (allVenues.length === 0) return [];

	const now = Date.now();
	const DAY_MS = 24 * 60 * 60 * 1000;

	const rows = allVenues.flatMap((venue) => {
		const count = rngInt(ctx.rng, 0, 2);
		return Array.from({ length: count }, () => {
			const daysAhead = rngInt(ctx.rng, 1, 21);
			const startAt = new Date(now + daysAhead * DAY_MS);
			startAt.setUTCHours(rngInt(ctx.rng, 9, 20), 0, 0, 0);
			const endAt = new Date(startAt.getTime() + 90 * 60 * 1000);

			return {
				venueId: venue.id,
				title: pick(ctx.rng, RENTAL_TITLE_POOL),
				startAt,
				endAt,
				price: String(rngInt(ctx.rng, 400, 1200)),
				status: pick(ctx.rng, ["confirmed", "confirmed", "confirmed", "tentative"] as const),
			};
		});
	});

	if (rows.length === 0) return [];
	return ctx.db.insert(venueRentals).values(rows).returning();
}

export const venuesContributor: Contributor = {
	name: "venues",
	dependsOn: ["identity", "structure"],
	async contribute(ctx: SimContext): Promise<void> {
		const orgs = getOrganizations(ctx);
		const leagueRows = getLeagues(ctx);

		const existingCanonicalsByOrg = await fetchExistingVenueCanonicalsByOrg(ctx);

		const venuesByOrg = new Map<string, Venue[]>();
		const allVenues: Venue[] = [];
		for (const org of orgs) {
			const created = await createVenuesForOrg(ctx, org, existingCanonicalsByOrg);
			venuesByOrg.set(org.id, created);
			allVenues.push(...created);
		}

		const { leagueVenueRows, timeWindowRows } = await createLeagueVenuesAndWindows(
			ctx,
			leagueRows,
			venuesByOrg,
		);
		const rentalRows = await createVenueRentals(ctx, allVenues);

		setData(ctx, VENUES_KEY, allVenues);
		setData(ctx, VENUE_RENTALS_KEY, rentalRows);
		setData(ctx, LEAGUE_VENUES_KEY, leagueVenueRows);
		setData(ctx, VENUE_TIME_WINDOWS_KEY, timeWindowRows);
	},
};

export function getVenues(ctx: SimContext): Venue[] {
	return requireData<Venue[]>(ctx, VENUES_KEY);
}
