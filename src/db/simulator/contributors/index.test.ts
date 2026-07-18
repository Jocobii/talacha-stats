import { describe, expect, it } from "vitest";
import { createRng } from "../rng";
import { createSimContext, type DbOrTx } from "../context";
import { createFakeDb } from "./test-helpers";
import {
	BOOTSTRAP_CONTRIBUTORS,
	CASCADE_CONTRIBUTORS,
	FULL_RUN_CONTRIBUTORS,
	runBootstrap,
	runFullBootstrap,
	getOrganizations,
	getGlobalPlayers,
	getLeagues,
	getTeams,
	getVenues,
	getLeagueMembers,
	getInscriptions,
	getMatchdays,
	getMatches,
	getMatchEvents,
	getMatchPlayerStats,
	getTeamStandingsSnapshots,
	getPlayerSeasonStats,
	getSuspensions,
} from "./index";

function makeCtx(seed: number, tier: "S" | "M" | "L" | "XL") {
	const fakeDb = createFakeDb();
	const ctx = createSimContext({
		rng: createRng(seed),
		seed,
		tier,
		db: fakeDb as unknown as DbOrTx,
	});
	return { ctx, fakeDb };
}

describe("BOOTSTRAP_CONTRIBUTORS", () => {
	it("está en orden topológico válido (identity, structure, venues, enrollment)", () => {
		expect(BOOTSTRAP_CONTRIBUTORS.map((c) => c.name)).toEqual([
			"identity",
			"structure",
			"venues",
			"enrollment",
		]);
	});
});

describe("CASCADE_CONTRIBUTORS", () => {
	it("está en orden topológico válido (calendar, matchplay, aggregates, discipline, playoffs)", () => {
		expect(CASCADE_CONTRIBUTORS.map((c) => c.name)).toEqual([
			"calendar",
			"matchplay",
			"aggregates",
			"discipline",
			"playoffs",
		]);
	});
});

describe("FULL_RUN_CONTRIBUTORS", () => {
	it("concatena bootstrap + cascada respetando el orden topológico completo", () => {
		expect(FULL_RUN_CONTRIBUTORS.map((c) => c.name)).toEqual([
			"identity",
			"structure",
			"venues",
			"enrollment",
			"calendar",
			"matchplay",
			"aggregates",
			"discipline",
			"playoffs",
		]);
	});
});

describe("runBootstrap", () => {
	it("corre el pipeline completo tier S sin errores y deja todo enlazado", async () => {
		const { ctx } = makeCtx(1, "S");
		await runBootstrap(ctx);

		const orgs = getOrganizations(ctx);
		const players = getGlobalPlayers(ctx);
		const leagueRows = getLeagues(ctx);
		const teamRows = getTeams(ctx);
		const venueRows = getVenues(ctx);
		const memberRows = getLeagueMembers(ctx);
		const inscriptionRows = getInscriptions(ctx);

		expect(orgs).toHaveLength(1);
		expect(leagueRows.every((l) => orgs.some((o) => o.id === l.organizationId))).toBe(true);
		expect(teamRows.every((t) => leagueRows.some((l) => l.id === t.leagueId))).toBe(true);
		expect(venueRows.every((v) => orgs.some((o) => o.id === v.organizationId))).toBe(true);
		expect(memberRows.every((m) => leagueRows.some((l) => l.id === m.leagueId))).toBe(true);
		expect(memberRows.every((m) => players.some((p) => p.id === m.globalPlayerId))).toBe(true);

		const memberIds = new Set(memberRows.map((m) => m.id));
		expect(inscriptionRows.every((i) => memberIds.has(i.leagueMemberId))).toBe(true);
		expect(inscriptionRows.every((i) => teamRows.some((t) => t.id === i.teamId))).toBe(true);
	});

	it("cada equipo termina con al menos playersPerTeam jugadores inscritos", async () => {
		const { ctx } = makeCtx(2, "M");
		await runBootstrap(ctx);

		const teamRows = getTeams(ctx);
		const inscriptionRows = getInscriptions(ctx);
		for (const team of teamRows) {
			const count = inscriptionRows.filter((i) => i.teamId === team.id).length;
			expect(count).toBeGreaterThanOrEqual(ctx.params.playersPerTeam);
		}
	});

	it("misma semilla y tier producen el mismo dataset completo", async () => {
		const { ctx: ctxA } = makeCtx(123, "S");
		await runBootstrap(ctxA);
		const { ctx: ctxB } = makeCtx(123, "S");
		await runBootstrap(ctxB);

		expect(getOrganizations(ctxA).map((o) => o.name)).toEqual(
			getOrganizations(ctxB).map((o) => o.name),
		);
		expect(getLeagues(ctxA).map((l) => l.name)).toEqual(getLeagues(ctxB).map((l) => l.name));
		expect(getGlobalPlayers(ctxA).map((p) => p.curpHash)).toEqual(
			getGlobalPlayers(ctxB).map((p) => p.curpHash),
		);
	});
});

describe("runFullBootstrap", () => {
	it("corre bootstrap + cascada tier S sin errores y deja todo enlazado", async () => {
		const { ctx } = makeCtx(1, "S");
		await runFullBootstrap(ctx);

		const leagueRows = getLeagues(ctx);
		const matchdayRows = getMatchdays(ctx);
		const matchRows = getMatches(ctx);
		const eventRows = getMatchEvents(ctx);
		const statRows = getMatchPlayerStats(ctx);
		const standingsRows = getTeamStandingsSnapshots(ctx);
		const playerSeasonRows = getPlayerSeasonStats(ctx);

		expect(matchdayRows.length).toBeGreaterThan(0);
		expect(matchRows.length).toBeGreaterThan(0);
		expect(matchRows.every((m) => leagueRows.some((l) => l.id === m.leagueId))).toBe(true);
		expect(statRows.length).toBeGreaterThan(0);
		expect(standingsRows.length).toBeGreaterThan(0);
		expect(playerSeasonRows.length).toBeGreaterThan(0);

		// Regla de oro (docs/ORGANIZATION-SIMULATOR.md §7): suma de goles de
		// match_events por equipo == marcador del match, de punta a punta del
		// pipeline completo (no solo dentro de matchplay aislado).
		for (const match of matchRows) {
			const homeGoals = eventRows.filter(
				(e) => e.matchId === match.id && e.teamId === match.homeTeamId && e.eventType === "goal",
			).length;
			const awayGoals = eventRows.filter(
				(e) => e.matchId === match.id && e.teamId === match.awayTeamId && e.eventType === "goal",
			).length;
			expect(homeGoals).toBe(match.homeScore);
			expect(awayGoals).toBe(match.awayScore);
		}
	});

	it("las suspensiones (si las hay) apuntan a jugadores y ligas reales del pipeline", async () => {
		const { ctx } = makeCtx(7, "M");
		await runFullBootstrap(ctx);

		const leagueRows = getLeagues(ctx);
		const players = getGlobalPlayers(ctx);
		const suspensionRows = getSuspensions(ctx);

		expect(suspensionRows.every((s) => leagueRows.some((l) => l.id === s.leagueId))).toBe(true);
		expect(suspensionRows.every((s) => players.some((p) => p.id === s.globalPlayerId))).toBe(true);
	});

	it("misma semilla produce el mismo dataset completo (bootstrap + cascada)", async () => {
		const { ctx: ctxA } = makeCtx(55, "S");
		await runFullBootstrap(ctxA);
		const { ctx: ctxB } = makeCtx(55, "S");
		await runFullBootstrap(ctxB);

		expect(getMatches(ctxA).map((m) => [m.homeScore, m.awayScore])).toEqual(
			getMatches(ctxB).map((m) => [m.homeScore, m.awayScore]),
		);
		expect(getPlayerSeasonStats(ctxA).map((p) => p.goals)).toEqual(
			getPlayerSeasonStats(ctxB).map((p) => p.goals),
		);
	});
});
