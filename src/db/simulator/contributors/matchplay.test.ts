import { describe, expect, it } from "vitest";
import type { League, Team, Matchday, LeagueMember, Inscription } from "@/db/schema";
import { createRng } from "../rng";
import { createSimContext, type DbOrTx } from "../context";
import { createFakeDb } from "./test-helpers";
import {
	matchplayContributor,
	getMatches,
	getMatchEvents,
	getMatchPlayerStats,
	simulateMatchScore,
	poissonSample,
	distributeGoalsAmongPresent,
} from "./matchplay";
import { LEAGUES_KEY, TEAMS_KEY } from "./structure";
import { MATCHDAYS_KEY } from "./calendar";
import { LEAGUE_MEMBERS_KEY, INSCRIPTIONS_KEY } from "./enrollment";

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

function makeTeams(leagueId: string, count: number): Team[] {
	return Array.from({ length: count }, (_, i) => ({
		id: `team-${i}`,
		name: `Team ${i}`,
		nameCanonical: `team ${i}`,
		leagueId,
		color: "#000000",
		status: "active" as const,
		createdAt: new Date(),
	}));
}

function makeRoster(
	teamRows: Team[],
	playersPerTeam: number,
): { members: LeagueMember[]; inscriptions: Inscription[] } {
	const members: LeagueMember[] = [];
	const inscriptions: Inscription[] = [];
	let counter = 0;
	for (const team of teamRows) {
		for (let i = 0; i < playersPerTeam; i++) {
			const memberId = `member-${counter}`;
			members.push({
				id: memberId,
				globalPlayerId: `gp-${counter}`,
				leagueId: team.leagueId,
				status: "active",
				dorsal: i + 1,
				inscriptionDate: "2026-01-01",
				institutionPhotoUrl: null,
				internalNotes: null,
				createdAt: new Date(),
			});
			inscriptions.push({
				id: `insc-${counter}`,
				leagueMemberId: memberId,
				teamId: team.id,
				createdAt: new Date(),
			});
			counter++;
		}
	}
	return { members, inscriptions };
}

function makeMatchday(leagueId: string, number: number): Matchday {
	return {
		id: `md-${leagueId}-${number}`,
		leagueId,
		number,
		phase: "regular",
		scheduledDate: "2026-01-05",
		status: "published",
		notes: null,
		createdAt: new Date(),
	};
}

function makeCtx(
	seed: number,
	tier: "S" | "M" | "L" | "XL",
	teamsPerLeague: number,
	playersPerTeam: number,
	jornadas: number,
) {
	const fakeDb = createFakeDb();
	const ctx = createSimContext({
		rng: createRng(seed),
		seed,
		tier,
		db: fakeDb as unknown as DbOrTx,
	});
	const league = makeLeague();
	const teamRows = makeTeams(league.id, teamsPerLeague);
	const { members, inscriptions } = makeRoster(teamRows, playersPerTeam);
	const matchdayRows = Array.from({ length: jornadas }, (_, i) => makeMatchday(league.id, i + 1));

	ctx.data[LEAGUES_KEY] = [league];
	ctx.data[TEAMS_KEY] = teamRows;
	ctx.data[LEAGUE_MEMBERS_KEY] = members;
	ctx.data[INSCRIPTIONS_KEY] = inscriptions;
	ctx.data[MATCHDAYS_KEY] = matchdayRows;

	return { ctx, fakeDb, league, teamRows, matchdayRows };
}

describe("poissonSample", () => {
	it("siempre devuelve un entero >= 0", () => {
		const rng = createRng(1);
		for (let i = 0; i < 200; i++) {
			expect(poissonSample(rng, 7.5)).toBeGreaterThanOrEqual(0);
		}
	});
});

describe("simulateMatchScore", () => {
	it("misma semilla produce el mismo marcador", () => {
		const a = simulateMatchScore(createRng(10), 70, 60);
		const b = simulateMatchScore(createRng(10), 70, 60);
		expect(a).toEqual(b);
	});
});

describe("distributeGoalsAmongPresent", () => {
	it("la suma del reparto siempre es igual a totalGoals", () => {
		const rng = createRng(3);
		for (const total of [0, 1, 5, 12]) {
			for (const present of [1, 7, 11]) {
				const dist = distributeGoalsAmongPresent(rng, total, present);
				expect(dist.reduce((a, b) => a + b, 0)).toBe(total);
				expect(dist).toHaveLength(present);
			}
		}
	});

	it("devuelve arreglo vacío si no hay presentes", () => {
		expect(distributeGoalsAmongPresent(createRng(1), 5, 0)).toEqual([]);
	});
});

describe("matchplayContributor", () => {
	it("crea un match por par de equipos por jornada", async () => {
		const { ctx, teamRows, matchdayRows } = makeCtx(1, "S", 8, 8, 2);
		await matchplayContributor.contribute(ctx);

		const matchRows = getMatches(ctx);
		expect(matchRows).toHaveLength((teamRows.length / 2) * matchdayRows.length);
	});

	it("invariante: homeScore/awayScore == suma de match_events tipo goal de ese equipo", async () => {
		const { ctx } = makeCtx(2, "M", 10, 10, 3);
		await matchplayContributor.contribute(ctx);

		const matchRows = getMatches(ctx);
		const eventRows = getMatchEvents(ctx);

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

	it("crea match_player_stats para todo el roster de ambos equipos (presentes y ausentes)", async () => {
		const { ctx } = makeCtx(3, "S", 8, 8, 1);
		await matchplayContributor.contribute(ctx);

		const matchRows = getMatches(ctx);
		const statRows = getMatchPlayerStats(ctx);
		for (const match of matchRows) {
			const forMatch = statRows.filter((s) => s.matchId === match.id);
			expect(forMatch).toHaveLength(16); // 8 + 8 jugadores registrados
		}
	});

	it("nunca repite cedula dentro de la misma liga", async () => {
		const { ctx } = makeCtx(4, "M", 10, 10, 3);
		await matchplayContributor.contribute(ctx);

		const matchRows = getMatches(ctx);
		const cedulas = matchRows.map((m) => m.cedula);
		expect(new Set(cedulas).size).toBe(cedulas.length);
	});

	it("misma semilla produce el mismo dataset", async () => {
		const { ctx: ctxA } = makeCtx(77, "S", 8, 8, 2);
		await matchplayContributor.contribute(ctxA);
		const { ctx: ctxB } = makeCtx(77, "S", 8, 8, 2);
		await matchplayContributor.contribute(ctxB);

		expect(getMatches(ctxA).map((m) => [m.homeScore, m.awayScore])).toEqual(
			getMatches(ctxB).map((m) => [m.homeScore, m.awayScore]),
		);
	});
});
