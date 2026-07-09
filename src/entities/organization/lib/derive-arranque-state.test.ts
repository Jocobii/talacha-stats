import { describe, it, expect } from "vitest";
import { deriveArranqueState } from "./derive-arranque-state";

describe("deriveArranqueState", () => {
	it("sin nada: todo en false", () => {
		const state = deriveArranqueState({ venueCount: 0, leagueCount: 0, scheduledLeagueCount: 0 });
		expect(state).toEqual({
			hasVenue: false,
			hasLeague: false,
			hasScheduledLeague: false,
			isComplete: false,
		});
	});

	it("con cancha pero sin liga: solo hasVenue", () => {
		const state = deriveArranqueState({ venueCount: 1, leagueCount: 0, scheduledLeagueCount: 0 });
		expect(state.hasVenue).toBe(true);
		expect(state.hasLeague).toBe(false);
		expect(state.isComplete).toBe(false);
	});

	it("con liga creada pero sin horario asignado: no está completo", () => {
		const state = deriveArranqueState({ venueCount: 1, leagueCount: 1, scheduledLeagueCount: 0 });
		expect(state.hasVenue).toBe(true);
		expect(state.hasLeague).toBe(true);
		expect(state.hasScheduledLeague).toBe(false);
		expect(state.isComplete).toBe(false);
	});

	it("completo: al menos una liga con cancha + ventana", () => {
		const state = deriveArranqueState({ venueCount: 2, leagueCount: 3, scheduledLeagueCount: 1 });
		expect(state.hasScheduledLeague).toBe(true);
		expect(state.isComplete).toBe(true);
	});
});
