import { describe, it, expect } from "vitest";
import {
	applyWalkoverDefaults,
	applyWalkoverStatusChange,
	isWalkoverStatus,
} from "./walkover-defaults";
import type { ResolutionState } from "../types";

function buildState(overrides: Partial<ResolutionState> = {}): ResolutionState {
	return {
		matchId: "m1",
		status: "played",
		homeScore: 2,
		awayScore: 1,
		homeBonusGoals: 1,
		awayBonusGoals: 0,
		refereeObservations: null,
		homePlayers: [],
		awayPlayers: [],
		...overrides,
	};
}

describe("isWalkoverStatus", () => {
	it("es true para walkover_home y walkover_away", () => {
		expect(isWalkoverStatus("walkover_home")).toBe(true);
		expect(isWalkoverStatus("walkover_away")).toBe(true);
	});

	it("es false para cualquier otro status", () => {
		expect(isWalkoverStatus("played")).toBe(false);
		expect(isWalkoverStatus("suspended")).toBe(false);
		expect(isWalkoverStatus("scheduled")).toBe(false);
	});
});

describe("applyWalkoverDefaults", () => {
	it("walkover_home → 3-0 a favor del local, los 3 goles van a goles de equipo del local", () => {
		expect(applyWalkoverDefaults("walkover_home")).toEqual({
			homeScore: 3,
			awayScore: 0,
			homeBonusGoals: 3,
			awayBonusGoals: 0,
		});
	});

	it("walkover_away → 0-3 a favor del visitante, los 3 goles van a goles de equipo del visitante", () => {
		expect(applyWalkoverDefaults("walkover_away")).toEqual({
			homeScore: 0,
			awayScore: 3,
			homeBonusGoals: 0,
			awayBonusGoals: 3,
		});
	});
});

describe("applyWalkoverStatusChange", () => {
	it("fija el marcador y limpia bonus, pero no toca las listas de jugadores", () => {
		const players = [
			{
				registrationId: "r1",
				playerProfileId: null,
				fullName: "Juan",
				jerseyNumber: 10,
				credentialCode: 42,
				isAdHoc: false,
				isPresent: true,
				shirtNumber: 10,
				goals: 2,
				assists: 0,
				yellowCards: 1,
				blueCards: 0,
				redCards: 0,
				dirty: true,
			},
		];
		const prev = buildState({ homePlayers: players, status: "played" });

		const next = applyWalkoverStatusChange(prev, "walkover_home");

		expect(next.status).toBe("walkover_home");
		expect(next.homeScore).toBe(3);
		expect(next.awayScore).toBe(0);
		expect(next.homeBonusGoals).toBe(3);
		expect(next.awayBonusGoals).toBe(0);
		// La lista de jugadores sigue intacta y editable — no se limpia en W.O.
		expect(next.homePlayers).toBe(players);
	});
});
