import { describe, expect, it } from "vitest";
import { matches, matchPlayerStats, inscriptions, leagueMembers, suspensions } from "@/db/schema";
import type { League, LeagueConfig } from "@/db/schema";
import { createRng } from "../rng";
import { createSimContext, type DbOrTx } from "../context";
import { createFakeDb } from "./test-helpers";
import { disciplineContributor, getSuspensions } from "./discipline";
import { LEAGUES_KEY, LEAGUE_CONFIGS_KEY } from "./structure";
import { MATCHES_KEY, MATCH_PLAYER_STATS_KEY } from "./matchplay";

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
		registrationCutoffMatchday: null,
		createdAt: new Date("2026-01-05T00:00:00Z"),
	};
}

function makeLeagueConfig(leagueId: string, overrides: Partial<LeagueConfig> = {}): LeagueConfig {
	return {
		leagueId,
		pointsWin: 3,
		pointsDraw: 1,
		tiebreakers: ["points", "head_to_head", "goal_diff", "goals_for", "name"],
		yellowThreshold: 5,
		redCardMatches: 1,
		blueCardMeaning: "temp",
		reinforcementLimit: null,
		financeLevel: 0,
		lockedAt: null,
		updatedAt: new Date(),
		...overrides,
	};
}

function baseCtx(seed: number, configOverrides: Partial<LeagueConfig> = {}) {
	const fakeDb = createFakeDb();
	const ctx = createSimContext({
		rng: createRng(seed),
		seed,
		tier: "S",
		db: fakeDb as unknown as DbOrTx,
	});
	const league = makeLeague();

	ctx.data[LEAGUES_KEY] = [league];
	ctx.data[LEAGUE_CONFIGS_KEY] = [makeLeagueConfig(league.id, configOverrides)];

	fakeDb.seed(leagueMembers, [{ id: "member-1", globalPlayerId: "gp-1", leagueId: league.id }]);
	fakeDb.seed(inscriptions, [{ id: "insc-1", leagueMemberId: "member-1", teamId: "team-a" }]);

	return { ctx, fakeDb, league };
}

describe("disciplineContributor", () => {
	it("crea suspensión por roja directa, matchesTotal = redCardMatches de la config", async () => {
		const { ctx, fakeDb, league } = baseCtx(1, { redCardMatches: 2 });

		fakeDb.seed(matches, [{ id: "match-1", leagueId: league.id, status: "played" }]);
		fakeDb.seed(matchPlayerStats, [
			{
				id: "mps-1",
				matchId: "match-1",
				playerRegistrationId: "insc-1",
				teamSide: "home",
				isPresent: true,
				goals: 0,
				assists: 0,
				yellowCards: 0,
				redCards: 1,
			},
		]);
		ctx.data[MATCHES_KEY] = [{ id: "match-1", leagueId: league.id }];
		ctx.data[MATCH_PLAYER_STATS_KEY] = [
			{
				id: "mps-1",
				matchId: "match-1",
				playerRegistrationId: "insc-1",
				teamSide: "home",
				isPresent: true,
				goals: 0,
				assists: 0,
				yellowCards: 0,
				redCards: 1,
			},
		];

		await disciplineContributor.contribute(ctx);

		const rows = getSuspensions(ctx);
		expect(rows).toHaveLength(1);
		expect(rows[0].reason).toBe("red_card");
		expect(rows[0].matchesTotal).toBe(2);
		expect(rows[0].globalPlayerId).toBe("gp-1");
	});

	it("crea suspensión por acumulación de amarillas al cruzar el umbral", async () => {
		const { ctx, fakeDb, league } = baseCtx(2, { yellowThreshold: 3 });

		// Historial: 2 amarillas ya sumadas en jornadas previas (partido histórico "played").
		fakeDb.seed(matches, [
			{ id: "match-old", leagueId: league.id, status: "played" },
			{ id: "match-new", leagueId: league.id, status: "played" },
		]);
		fakeDb.seed(matchPlayerStats, [
			{
				id: "mps-old",
				matchId: "match-old",
				playerRegistrationId: "insc-1",
				teamSide: "home",
				isPresent: true,
				goals: 0,
				assists: 0,
				yellowCards: 2,
				redCards: 0,
			},
			{
				id: "mps-new",
				matchId: "match-new",
				playerRegistrationId: "insc-1",
				teamSide: "home",
				isPresent: true,
				goals: 0,
				assists: 0,
				yellowCards: 1,
				redCards: 0,
			},
		]);

		ctx.data[MATCHES_KEY] = [{ id: "match-new", leagueId: league.id }];
		ctx.data[MATCH_PLAYER_STATS_KEY] = [
			{
				id: "mps-new",
				matchId: "match-new",
				playerRegistrationId: "insc-1",
				teamSide: "home",
				isPresent: true,
				goals: 0,
				assists: 0,
				yellowCards: 1,
				redCards: 0,
			},
		];

		await disciplineContributor.contribute(ctx);

		const rows = getSuspensions(ctx);
		expect(rows).toHaveLength(1);
		expect(rows[0].reason).toBe("yellow_accumulation");
		expect(rows[0].matchesTotal).toBe(1);
	});

	it("no crea suspensión de amarillas si el total histórico aún no cruza el umbral", async () => {
		const { ctx, fakeDb, league } = baseCtx(3, { yellowThreshold: 5 });

		fakeDb.seed(matches, [{ id: "match-new", leagueId: league.id, status: "played" }]);
		fakeDb.seed(matchPlayerStats, [
			{
				id: "mps-new",
				matchId: "match-new",
				playerRegistrationId: "insc-1",
				teamSide: "home",
				isPresent: true,
				goals: 0,
				assists: 0,
				yellowCards: 1,
				redCards: 0,
			},
		]);
		ctx.data[MATCHES_KEY] = [{ id: "match-new", leagueId: league.id }];
		ctx.data[MATCH_PLAYER_STATS_KEY] = [
			{
				id: "mps-new",
				matchId: "match-new",
				playerRegistrationId: "insc-1",
				teamSide: "home",
				isPresent: true,
				goals: 0,
				assists: 0,
				yellowCards: 1,
				redCards: 0,
			},
		];

		await disciplineContributor.contribute(ctx);

		expect(getSuspensions(ctx)).toHaveLength(0);
	});

	it("no duplica una suspensión ya registrada para el mismo match+jugador+motivo", async () => {
		const { ctx, fakeDb, league } = baseCtx(4, { redCardMatches: 1 });

		fakeDb.seed(matches, [{ id: "match-1", leagueId: league.id, status: "played" }]);
		fakeDb.seed(matchPlayerStats, [
			{
				id: "mps-1",
				matchId: "match-1",
				playerRegistrationId: "insc-1",
				teamSide: "home",
				isPresent: true,
				goals: 0,
				assists: 0,
				yellowCards: 0,
				redCards: 1,
			},
		]);
		fakeDb.seed(suspensions, [
			{
				id: "susp-existing",
				globalPlayerId: "gp-1",
				leagueId: league.id,
				reason: "red_card",
				durationType: "matches",
				matchesTotal: 1,
				matchesServed: 0,
				status: "active",
				sourceMatchId: "match-1",
			},
		]);
		ctx.data[MATCHES_KEY] = [{ id: "match-1", leagueId: league.id }];
		ctx.data[MATCH_PLAYER_STATS_KEY] = [
			{
				id: "mps-1",
				matchId: "match-1",
				playerRegistrationId: "insc-1",
				teamSide: "home",
				isPresent: true,
				goals: 0,
				assists: 0,
				yellowCards: 0,
				redCards: 1,
			},
		];

		await disciplineContributor.contribute(ctx);

		// getSuspensions(ctx) solo trae lo insertado EN ESTA corrida — debe ser 0.
		expect(getSuspensions(ctx)).toHaveLength(0);
	});

	it("sin tarjetas en los matches nuevos, no crea ninguna suspensión", async () => {
		const { ctx, fakeDb, league } = baseCtx(5);

		fakeDb.seed(matches, [{ id: "match-1", leagueId: league.id, status: "played" }]);
		fakeDb.seed(matchPlayerStats, [
			{
				id: "mps-1",
				matchId: "match-1",
				playerRegistrationId: "insc-1",
				teamSide: "home",
				isPresent: true,
				goals: 1,
				assists: 0,
				yellowCards: 0,
				redCards: 0,
			},
		]);
		ctx.data[MATCHES_KEY] = [{ id: "match-1", leagueId: league.id }];
		ctx.data[MATCH_PLAYER_STATS_KEY] = [
			{
				id: "mps-1",
				matchId: "match-1",
				playerRegistrationId: "insc-1",
				teamSide: "home",
				isPresent: true,
				goals: 1,
				assists: 0,
				yellowCards: 0,
				redCards: 0,
			},
		];

		await disciplineContributor.contribute(ctx);

		expect(getSuspensions(ctx)).toHaveLength(0);
	});
});
