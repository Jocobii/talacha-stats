import { describe, it, expect } from "vitest";
import { computeNarratorAnalysis } from "./analysis";
import type {
	NarratorInput,
	RosterPlayer,
	TeamInputData,
	LeagueStandingRow,
} from "@/entities/narrator/model";

function player(
	over: Partial<RosterPlayer> & { playerId: string; fullName: string },
): RosterPlayer {
	return {
		alias: null,
		goals: 0,
		assists: 0,
		contributions: 0,
		yellowCards: 0,
		redCards: 0,
		matchesPlayed: 0,
		goalsPerMatch: 0,
		dangerRating: "BAJO",
		...over,
	};
}

function team(
	over: Partial<TeamInputData> & { team: { id: string; name: string } },
): TeamInputData {
	return {
		position: null,
		record: { wins: 0, draws: 0, losses: 0, played: 0 },
		points: 0,
		goalsFor: 0,
		goalsAgainst: 0,
		last5: [],
		currentStreak: null,
		roster: [],
		...over,
	};
}

const standings: LeagueStandingRow[] = [
	{ teamId: "a", points: 10, goalsFor: 9, goalsAgainst: 4 },
	{ teamId: "b", points: 7, goalsFor: 7, goalsAgainst: 6 },
	{ teamId: "c", points: 3, goalsFor: 3, goalsAgainst: 11 },
];

function excelLikeInput(): NarratorInput {
	return {
		league: { id: "excel", name: "Liga (Excel)", season: "" },
		lastMatchday: null,
		teamA: team({
			team: { id: "a", name: "aguilas" },
			position: 1,
			record: { wins: 3, draws: 1, losses: 1, played: 5 },
			points: 10,
			goalsFor: 9,
			goalsAgainst: 4,
		}),
		teamB: team({
			team: { id: "b", name: "tiburones" },
			position: 2,
			record: { wins: 2, draws: 1, losses: 2, played: 5 },
			points: 7,
			goalsFor: 7,
			goalsAgainst: 6,
		}),
		standings,
		matches: [],
	};
}

describe("computeNarratorAnalysis — flujo Excel (sin roster ni partidos)", () => {
	it("calcula probabilidad de victoria sumando 100%", () => {
		const { winProbability: p } = computeNarratorAnalysis(excelLikeInput());
		expect(p.aWinPct + p.drawPct + p.bWinPct).toBe(100);
		expect(p.method).toBe("weighted_record");
	});

	it("deja el head-to-head en cero cuando no hay partidos", () => {
		const { headToHead } = computeNarratorAnalysis(excelLikeInput());
		expect(headToHead.total).toBe(0);
		expect(headToHead.lastMatch).toBeNull();
	});

	it("calcula ranks de ataque/defensa desde la tabla", () => {
		const { teamA, teamB } = computeNarratorAnalysis(excelLikeInput());
		expect(teamA.attackRank).toBe(1); // 9 goles, el más goleador
		expect(teamA.defenseRank).toBe(1); // 4 en contra, la mejor defensa
		expect(teamA.totalTeams).toBe(3);
		expect(teamB.attackRank).toBe(2);
	});

	it("simula posiciones según el resultado", () => {
		const { positionSimulator } = computeNarratorAnalysis(excelLikeInput());
		expect(positionSimulator.teamA.currentPosition).toBe(1);
		expect(positionSimulator.teamB.currentPosition).toBe(2);
		// B gana → 10 pts, empata a A en puntos pero A gana por diferencia de
		// goles (+5 vs +1), así que B se queda 2°.
		expect(positionSimulator.teamB.ifWin).toBe(2);
	});

	it("genera predicción con datos cuando ambos jugaron", () => {
		const { matchPrediction } = computeNarratorAnalysis(excelLikeInput());
		expect(matchPrediction.hasData).toBe(true);
		expect(matchPrediction.expectedTotal).toBeGreaterThan(0);
	});

	it("no produce bullets de goleador sin roster", () => {
		const { narratorBullets, teamA } = computeNarratorAnalysis(excelLikeInput());
		expect(teamA.topScorer).toBeNull();
		expect(narratorBullets.some((b) => b.includes("Amenaza principal"))).toBe(false);
	});
});

describe("computeNarratorAnalysis — flujo con roster", () => {
	it("identifica goleador, riesgo de tarjetas y amenazas", () => {
		const input = excelLikeInput();
		input.teamA.roster = [
			player({
				playerId: "p1",
				fullName: "juan perez",
				goals: 6,
				contributions: 6,
				goalsPerMatch: 1.2,
				matchesPlayed: 5,
				dangerRating: "ALTO",
			}),
			player({
				playerId: "p2",
				fullName: "luis gomez",
				assists: 4,
				contributions: 4,
				yellowCards: 2,
			}),
		];

		const { teamA, narratorBullets } = computeNarratorAnalysis(input);
		expect(teamA.topScorer?.fullName).toBe("juan perez");
		expect(teamA.topAssist?.fullName).toBe("luis gomez");
		expect(teamA.cardRisk).toHaveLength(1);
		expect(narratorBullets.some((b) => b.includes("Amenaza principal"))).toBe(true);
	});
});

describe("computeNarratorAnalysis — sin datos", () => {
	it("degrada con elegancia cuando no hay tabla ni partidos jugados", () => {
		const input = excelLikeInput();
		input.standings = [];
		input.teamA = team({ team: { id: "a", name: "aguilas" } });
		input.teamB = team({ team: { id: "b", name: "tiburones" } });

		const result = computeNarratorAnalysis(input);
		expect(result.winProbability.method).toBe("sin_datos");
		expect(result.matchPrediction.hasData).toBe(false);
		expect(result.teamA.attackRank).toBeNull();
		expect(result.positionSimulator.teamA.currentPosition).toBeNull();
	});
});
