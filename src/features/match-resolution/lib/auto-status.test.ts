import { describe, it, expect } from "vitest";
import { autoMarkPlayedOnScore } from "./auto-status";
import type { ResolutionState } from "../types";

function buildState(overrides: Partial<ResolutionState> = {}): ResolutionState {
	return {
		matchId: "m1",
		status: "scheduled",
		homeScore: null,
		awayScore: null,
		homeBonusGoals: 0,
		awayBonusGoals: 0,
		refereeObservations: null,
		homePlayers: [],
		awayPlayers: [],
		...overrides,
	};
}

describe("autoMarkPlayedOnScore", () => {
	it("pasa a 'played' cuando ambos marcadores están capturados y el status es 'scheduled'", () => {
		const next = autoMarkPlayedOnScore(buildState({ homeScore: 2, awayScore: 1 }));
		expect(next.status).toBe("played");
	});

	it("no cambia el status si falta el marcador local", () => {
		const next = autoMarkPlayedOnScore(buildState({ homeScore: null, awayScore: 1 }));
		expect(next.status).toBe("scheduled");
	});

	it("no cambia el status si falta el marcador visitante", () => {
		const next = autoMarkPlayedOnScore(buildState({ homeScore: 2, awayScore: null }));
		expect(next.status).toBe("scheduled");
	});

	it("no toca el status si ya no es 'scheduled' (ej. walkover, suspendido)", () => {
		const next = autoMarkPlayedOnScore(
			buildState({ status: "walkover_home", homeScore: 3, awayScore: 0 }),
		);
		expect(next.status).toBe("walkover_home");
	});

	it("no muta el estado original", () => {
		const prev = buildState({ homeScore: 2, awayScore: 1 });
		autoMarkPlayedOnScore(prev);
		expect(prev.status).toBe("scheduled");
	});
});
