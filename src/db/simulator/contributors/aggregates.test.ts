import { describe, expect, it } from "vitest";
import { matches, matchdays, matchPlayerStats, inscriptions, leagueMembers } from "@/db/schema";
import type { League, Team } from "@/db/schema";
import { createRng } from "../rng";
import { createSimContext, type DbOrTx } from "../context";
import { createFakeDb } from "./test-helpers";
import {
	aggregatesContributor,
	getTeamStandingsSnapshots,
	getPlayerSeasonStats,
} from "./aggregates";
import { LEAGUES_KEY, TEAMS_KEY } from "./structure";
import { MATCHDAYS_KEY } from "./calendar";

function makeLeague(): League {
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
	};
}

function makeTeam(id: string, leagueId: string): Team {
	return {
		id,
		name: id,
		nameCanonical: id,
		leagueId,
		color: "#000000",
		status: "active",
		createdAt: new Date(),
	};
}

function baseCtx(seed: number) {
	const fakeDb = createFakeDb();
	const ctx = createSimContext({
		rng: createRng(seed),
		seed,
		tier: "S",
		db: fakeDb as unknown as DbOrTx,
	});
	const league = makeLeague();
	const teamA = makeTeam("team-a", league.id);
	const teamB = makeTeam("team-b", league.id);

	ctx.data[LEAGUES_KEY] = [league];
	ctx.data[TEAMS_KEY] = [teamA, teamB];

	return { ctx, fakeDb, league, teamA, teamB };
}

describe("aggregatesContributor", () => {
	it("calcula la tabla de posiciones desde matches reales", async () => {
		const { ctx, fakeDb, league, teamA, teamB } = baseCtx(1);

		fakeDb.seed(matchdays, [
			{
				id: "md-1",
				leagueId: league.id,
				number: 1,
				phase: "regular",
				scheduledDate: "2026-01-05",
				status: "published",
			},
		]);
		fakeDb.seed(matches, [
			{
				id: "match-1",
				leagueId: league.id,
				homeTeamId: teamA.id,
				awayTeamId: teamB.id,
				matchDate: "2026-01-05",
				status: "played",
				homeScore: 3,
				awayScore: 1,
				matchdayId: "md-1",
			},
		]);
		ctx.data[MATCHDAYS_KEY] = [{ id: "md-1", leagueId: league.id, number: 1 }];

		await aggregatesContributor.contribute(ctx);

		const standings = getTeamStandingsSnapshots(ctx);
		const teamAStanding = standings.find((s) => s.teamId === teamA.id && s.jornada === 1)!;
		const teamBStanding = standings.find((s) => s.teamId === teamB.id && s.jornada === 1)!;

		expect(teamAStanding.points).toBe(3);
		expect(teamAStanding.wins).toBe(1);
		expect(teamAStanding.goalsFor).toBe(3);
		expect(teamAStanding.goalsAgainst).toBe(1);
		expect(teamBStanding.points).toBe(0);
		expect(teamBStanding.losses).toBe(1);
	});

	it("suma goles/asistencias/tarjetas de match_player_stats en player_season_stats", async () => {
		const { ctx, fakeDb, league, teamA, teamB } = baseCtx(2);

		fakeDb.seed(matchdays, [
			{
				id: "md-1",
				leagueId: league.id,
				number: 1,
				phase: "regular",
				scheduledDate: "2026-01-05",
				status: "published",
			},
		]);
		fakeDb.seed(matches, [
			{
				id: "match-1",
				leagueId: league.id,
				homeTeamId: teamA.id,
				awayTeamId: teamB.id,
				matchDate: "2026-01-05",
				status: "played",
				homeScore: 2,
				awayScore: 0,
				matchdayId: "md-1",
			},
		]);
		fakeDb.seed(leagueMembers, [{ id: "member-1", globalPlayerId: "gp-1", leagueId: league.id }]);
		fakeDb.seed(inscriptions, [{ id: "insc-1", leagueMemberId: "member-1", teamId: teamA.id }]);
		fakeDb.seed(matchPlayerStats, [
			{
				id: "mps-1",
				matchId: "match-1",
				playerRegistrationId: "insc-1",
				teamSide: "home",
				isPresent: true,
				goals: 2,
				assists: 1,
				yellowCards: 1,
				redCards: 0,
			},
		]);
		ctx.data[MATCHDAYS_KEY] = [{ id: "md-1", leagueId: league.id, number: 1 }];

		await aggregatesContributor.contribute(ctx);

		const playerStats = getPlayerSeasonStats(ctx);
		const gp1 = playerStats.find((p) => p.globalPlayerId === "gp-1")!;
		expect(gp1.goals).toBe(2);
		expect(gp1.assists).toBe(1);
		expect(gp1.yellowCards).toBe(1);
		expect(gp1.matchesPlayed).toBe(1);
	});

	it("acumula la tabla a través de 2 jornadas", async () => {
		const { ctx, fakeDb, league, teamA, teamB } = baseCtx(3);

		fakeDb.seed(matchdays, [
			{
				id: "md-1",
				leagueId: league.id,
				number: 1,
				phase: "regular",
				scheduledDate: "2026-01-05",
				status: "published",
			},
			{
				id: "md-2",
				leagueId: league.id,
				number: 2,
				phase: "regular",
				scheduledDate: "2026-01-12",
				status: "published",
			},
		]);
		fakeDb.seed(matches, [
			{
				id: "match-1",
				leagueId: league.id,
				homeTeamId: teamA.id,
				awayTeamId: teamB.id,
				matchDate: "2026-01-05",
				status: "played",
				homeScore: 2,
				awayScore: 0,
				matchdayId: "md-1",
			},
			{
				id: "match-2",
				leagueId: league.id,
				homeTeamId: teamB.id,
				awayTeamId: teamA.id,
				matchDate: "2026-01-12",
				status: "played",
				homeScore: 1,
				awayScore: 1,
				matchdayId: "md-2",
			},
		]);
		ctx.data[MATCHDAYS_KEY] = [
			{ id: "md-1", leagueId: league.id, number: 1 },
			{ id: "md-2", leagueId: league.id, number: 2 },
		];

		await aggregatesContributor.contribute(ctx);

		const standings = getTeamStandingsSnapshots(ctx);
		const teamAJornada1 = standings.find((s) => s.teamId === teamA.id && s.jornada === 1)!;
		const teamAJornada2 = standings.find((s) => s.teamId === teamA.id && s.jornada === 2)!;

		expect(teamAJornada1.points).toBe(3); // ganó jornada 1
		expect(teamAJornada2.points).toBe(4); // + empate jornada 2
		expect(teamAJornada2.played).toBe(2);
	});

	it("no escribe nada si la liga no tiene jornadas nuevas que snapshotear", async () => {
		const { ctx } = baseCtx(4);
		ctx.data[MATCHDAYS_KEY] = [];

		await aggregatesContributor.contribute(ctx);

		expect(getTeamStandingsSnapshots(ctx)).toHaveLength(0);
		expect(getPlayerSeasonStats(ctx)).toHaveLength(0);
	});
});
