import { describe, expect, it } from "vitest";
import { matchdays } from "@/db/schema";
import type { League } from "@/db/schema";
import { createRng } from "../rng";
import { createSimContext, type DbOrTx } from "../context";
import { createFakeDb } from "./test-helpers";
import { calendarContributor, getMatchdays, scheduledDateForJornada } from "./calendar";
import { LEAGUES_KEY } from "./structure";

function makeLeague(overrides: Partial<League> = {}): League {
	return {
		id: "league-1",
		name: "Liga Test",
		nameCanonical: "liga test",
		slug: "liga-test",
		category: "Libre",
		dayOfWeek: "lunes",
		season: "Temporada 1",
		city: "Tijuana",
		organizationId: "org-1",
		status: "active",
		schedulingEnabled: true,
		code: "LT",
		createdAt: new Date("2026-01-05T00:00:00Z"),
		...overrides,
	};
}

function makeCtx(
	seed: number,
	tier: "S" | "M" | "L" | "XL",
	leagueRows: League[],
	jornadasToAdvance?: number,
) {
	const fakeDb = createFakeDb();
	const ctx = createSimContext({
		rng: createRng(seed),
		seed,
		tier,
		db: fakeDb as unknown as DbOrTx,
		jornadasToAdvance,
	});
	ctx.data[LEAGUES_KEY] = leagueRows;
	return { ctx, fakeDb };
}

describe("calendarContributor", () => {
	it("crea jornadasToAdvance matchdays nuevos, numerados desde 1", async () => {
		const league = makeLeague();
		const { ctx } = makeCtx(1, "S", [league], 3);
		await calendarContributor.contribute(ctx);

		const rows = getMatchdays(ctx);
		expect(rows.map((r) => r.number).sort((a, b) => a - b)).toEqual([1, 2, 3]);
	});

	it("avanza desde el max existente, no reinicia en 1", async () => {
		const league = makeLeague();
		const { ctx, fakeDb } = makeCtx(2, "S", [league], 2);
		fakeDb.seed(matchdays, [
			{
				id: "md-1",
				leagueId: league.id,
				number: 5,
				phase: "regular",
				scheduledDate: "2026-02-01",
				status: "completed",
			},
		]);

		await calendarContributor.contribute(ctx);

		const rows = getMatchdays(ctx);
		expect(rows.map((r) => r.number).sort((a, b) => a - b)).toEqual([6, 7]);
	});

	it("no excede JORNADAS_PER_TEMPORADA (20)", async () => {
		const league = makeLeague();
		const { ctx, fakeDb } = makeCtx(3, "S", [league], 5);
		fakeDb.seed(matchdays, [
			{
				id: "md-1",
				leagueId: league.id,
				number: 18,
				phase: "regular",
				scheduledDate: "2026-02-01",
				status: "completed",
			},
		]);

		await calendarContributor.contribute(ctx);

		const rows = getMatchdays(ctx);
		expect(rows.map((r) => r.number).sort((a, b) => a - b)).toEqual([19, 20]);
	});

	it("no crea nada si la liga ya está en la jornada 20", async () => {
		const league = makeLeague();
		const { ctx, fakeDb } = makeCtx(4, "S", [league], 3);
		fakeDb.seed(matchdays, [
			{
				id: "md-1",
				leagueId: league.id,
				number: 20,
				phase: "regular",
				scheduledDate: "2026-02-01",
				status: "completed",
			},
		]);

		await calendarContributor.contribute(ctx);

		expect(getMatchdays(ctx)).toHaveLength(0);
	});

	it("cada jornada queda 7 días después de la anterior", () => {
		const league = makeLeague();
		expect(scheduledDateForJornada(league, 1)).toBe("2026-01-05");
		expect(scheduledDateForJornada(league, 2)).toBe("2026-01-12");
		expect(scheduledDateForJornada(league, 3)).toBe("2026-01-19");
	});

	it("procesa varias ligas independientemente", async () => {
		const leagueA = makeLeague({ id: "league-a" });
		const leagueB = makeLeague({ id: "league-b" });
		const { ctx } = makeCtx(5, "S", [leagueA, leagueB], 2);

		await calendarContributor.contribute(ctx);

		const rows = getMatchdays(ctx);
		expect(rows.filter((r) => r.leagueId === "league-a")).toHaveLength(2);
		expect(rows.filter((r) => r.leagueId === "league-b")).toHaveLength(2);
	});
});
