import { describe, expect, it } from "vitest";
import type { Organization, League } from "@/db/schema";
import { createRng } from "../rng";
import { createSimContext, type DbOrTx } from "../context";
import { createFakeDb } from "./test-helpers";
import { venuesContributor, getVenues, VENUE_TIME_WINDOWS_KEY, LEAGUE_VENUES_KEY } from "./venues";

function makeOrgs(n: number): Organization[] {
	return Array.from({ length: n }, (_, i) => ({
		id: `org-${i}`,
		name: `Org ${i}`,
		slug: `org-${i}`,
		logoUrl: null,
		city: "Tijuana",
		status: "verified" as const,
		verificationRequestedAt: null,
		createdAt: new Date(),
	}));
}

function makeLeagues(orgs: Organization[], perOrg: number): League[] {
	const days = ["lunes", "martes", "miercoles", "jueves", "viernes"] as const;
	return orgs.flatMap((org, oi) =>
		Array.from({ length: perOrg }, (_, i) => ({
			id: `league-${oi}-${i}`,
			name: `Liga ${oi}-${i}`,
			nameCanonical: `liga ${oi} ${i}`,
			slug: `liga-${oi}-${i}`,
			category: "Libre",
			dayOfWeek: days[i % days.length],
			season: "Temporada 1",
			city: org.city,
			organizationId: org.id,
			status: "active" as const,
			schedulingEnabled: true,
			code: `L${oi}${i}`,
			registrationCutoffMatchday: null,
			createdAt: new Date(),
		})),
	);
}

function makeCtx(seed: number, tier: "S" | "M" | "L" | "XL", orgCount = 1) {
	const fakeDb = createFakeDb();
	const ctx = createSimContext({
		rng: createRng(seed),
		seed,
		tier,
		db: fakeDb as unknown as DbOrTx,
	});
	const orgs = makeOrgs(orgCount);
	ctx.data.organizations = orgs;
	ctx.data.leagues = makeLeagues(orgs, ctx.params.leaguesPerOrg);
	return { ctx, fakeDb };
}

describe("venuesContributor", () => {
	it("crea al menos 2 canchas por organización", async () => {
		const { ctx } = makeCtx(1, "M", 2);
		await venuesContributor.contribute(ctx);

		const venueRows = getVenues(ctx);
		for (const org of ctx.data.organizations as Organization[]) {
			const forOrg = venueRows.filter((v) => v.organizationId === org.id);
			expect(forOrg.length).toBeGreaterThanOrEqual(2);
		}
	});

	it("no repite nameCanonical de cancha dentro de la misma organización", async () => {
		const { ctx } = makeCtx(2, "L", 1);
		await venuesContributor.contribute(ctx);

		const venueRows = getVenues(ctx);
		expect(new Set(venueRows.map((v) => v.nameCanonical)).size).toBe(venueRows.length);
	});

	it("asigna al menos una cancha (league_venues) a cada liga", async () => {
		const { ctx } = makeCtx(3, "S", 1);
		await venuesContributor.contribute(ctx);

		const leagueVenueRows = ctx.data[LEAGUE_VENUES_KEY] as { leagueId: string }[];
		const leagueRows = ctx.data.leagues as League[];
		for (const league of leagueRows) {
			expect(leagueVenueRows.some((lv) => lv.leagueId === league.id)).toBe(true);
		}
	});

	it("crea al menos una ventana horaria por liga, en el día de la liga", async () => {
		const { ctx } = makeCtx(4, "S", 1);
		await venuesContributor.contribute(ctx);

		const windows = ctx.data[VENUE_TIME_WINDOWS_KEY] as { leagueId: string; dayOfWeek: string }[];
		const leagueRows = ctx.data.leagues as League[];
		for (const league of leagueRows) {
			const forLeague = windows.filter((w) => w.leagueId === league.id);
			expect(forLeague.length).toBeGreaterThanOrEqual(1);
			expect(forLeague.every((w) => w.dayOfWeek === league.dayOfWeek)).toBe(true);
		}
	});

	it("misma semilla produce el mismo set de canchas", async () => {
		const { ctx: ctxA } = makeCtx(50, "S", 1);
		await venuesContributor.contribute(ctxA);
		const { ctx: ctxB } = makeCtx(50, "S", 1);
		await venuesContributor.contribute(ctxB);

		expect(getVenues(ctxA).map((v) => v.name)).toEqual(getVenues(ctxB).map((v) => v.name));
	});
});
