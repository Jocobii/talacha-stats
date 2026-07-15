import { describe, expect, it } from "vitest";
import { leagueConfig, leagueSchedulingConfig, leaguePlayoffZones } from "@/db/schema";
import type { Organization } from "@/db/schema";
import { createRng } from "../rng";
import { createSimContext, type DbOrTx } from "../context";
import { createFakeDb } from "./test-helpers";
import {
	structureContributor,
	getLeagues,
	getTeams,
	defaultPlayoffZones,
	TEAMS_KEY,
} from "./structure";

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

function makeCtx(seed: number, tier: "S" | "M" | "L" | "XL", orgCount = 1) {
	const fakeDb = createFakeDb();
	const ctx = createSimContext({
		rng: createRng(seed),
		seed,
		tier,
		db: fakeDb as unknown as DbOrTx,
	});
	ctx.data.organizations = makeOrgs(orgCount);
	return { ctx, fakeDb };
}

describe("structureContributor", () => {
	it("crea leaguesPerOrg ligas por cada organización", async () => {
		const { ctx } = makeCtx(1, "M", 2);
		await structureContributor.contribute(ctx);

		const leagueRows = getLeagues(ctx);
		expect(leagueRows).toHaveLength(2 * ctx.params.leaguesPerOrg);
		for (const org of ctx.data.organizations as Organization[]) {
			const forOrg = leagueRows.filter((l) => l.organizationId === org.id);
			expect(forOrg).toHaveLength(ctx.params.leaguesPerOrg);
		}
	});

	it("crea teamsPerLeague equipos por liga, sin nombre canónico repetido dentro de la liga", async () => {
		const { ctx } = makeCtx(2, "S", 1);
		await structureContributor.contribute(ctx);

		const leagueRows = getLeagues(ctx);
		const teamRows = getTeams(ctx);
		for (const league of leagueRows) {
			const forLeague = teamRows.filter((t) => t.leagueId === league.id);
			expect(forLeague).toHaveLength(ctx.params.teamsPerLeague);
			expect(new Set(forLeague.map((t) => t.nameCanonical)).size).toBe(forLeague.length);
		}
	});

	it("crea league_config y league_scheduling_config 1:1 con cada liga", async () => {
		const { ctx, fakeDb } = makeCtx(3, "S", 1);
		await structureContributor.contribute(ctx);

		const leagueRows = getLeagues(ctx);
		expect(fakeDb.rowsOf(leagueConfig)).toHaveLength(leagueRows.length);
		expect(fakeDb.rowsOf(leagueSchedulingConfig)).toHaveLength(leagueRows.length);
	});

	it("regularMatchdays = teamsPerLeague - 1 (round robin simple)", async () => {
		const { ctx, fakeDb } = makeCtx(4, "S", 1);
		await structureContributor.contribute(ctx);

		const configs = fakeDb.rowsOf(leagueSchedulingConfig) as { regularMatchdays: number }[];
		for (const c of configs) {
			expect(c.regularMatchdays).toBe(ctx.params.teamsPerLeague - 1);
		}
	});

	it("nunca repite league.code ni league.slug entre ligas de la misma corrida", async () => {
		const { ctx } = makeCtx(5, "L", 1);
		await structureContributor.contribute(ctx);

		const leagueRows = getLeagues(ctx);
		expect(new Set(leagueRows.map((l) => l.code)).size).toBe(leagueRows.length);
		expect(new Set(leagueRows.map((l) => l.slug)).size).toBe(leagueRows.length);
	});

	it("crea zonas de playoff coherentes con defaultPlayoffZones(teamsPerLeague)", async () => {
		const { ctx, fakeDb } = makeCtx(6, "S", 1);
		await structureContributor.contribute(ctx);

		const leagueRows = getLeagues(ctx);
		const zones = fakeDb.rowsOf(leaguePlayoffZones);
		const expectedPerLeague = defaultPlayoffZones(ctx.params.teamsPerLeague).length;
		expect(zones).toHaveLength(leagueRows.length * expectedPerLeague);
	});

	it("misma semilla produce las mismas ligas y equipos", async () => {
		const { ctx: ctxA } = makeCtx(99, "S", 1);
		await structureContributor.contribute(ctxA);

		const { ctx: ctxB } = makeCtx(99, "S", 1);
		await structureContributor.contribute(ctxB);

		expect(getLeagues(ctxA).map((l) => l.name)).toEqual(getLeagues(ctxB).map((l) => l.name));
		expect((ctxA.data[TEAMS_KEY] as { name: string }[]).map((t) => t.name)).toEqual(
			(ctxB.data[TEAMS_KEY] as { name: string }[]).map((t) => t.name),
		);
	});
});

describe("defaultPlayoffZones", () => {
	it("no excede teamsPerLeague en toPosition", () => {
		for (const size of [8, 10, 12, 14]) {
			const zones = defaultPlayoffZones(size);
			for (const z of zones) {
				expect(z.toPosition).toBeLessThanOrEqual(size);
				expect(z.fromPosition).toBeLessThanOrEqual(z.toPosition);
			}
		}
	});

	it("las zonas no se solapan", () => {
		const zones = defaultPlayoffZones(12);
		for (let i = 1; i < zones.length; i++) {
			expect(zones[i].fromPosition).toBeGreaterThan(zones[i - 1].toPosition);
		}
	});
});
