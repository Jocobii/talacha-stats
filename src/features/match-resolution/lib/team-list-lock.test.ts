import { describe, it, expect } from "vitest";
import { isTeamListDisabled } from "./team-list-lock";

describe("isTeamListDisabled", () => {
	it("played no bloquea ninguna lista", () => {
		expect(isTeamListDisabled("played", "home")).toBe(false);
		expect(isTeamListDisabled("played", "away")).toBe(false);
	});

	it("scheduled no bloquea ninguna lista", () => {
		expect(isTeamListDisabled("scheduled", "home")).toBe(false);
		expect(isTeamListDisabled("scheduled", "away")).toBe(false);
	});

	it("suspended bloquea ambas listas", () => {
		expect(isTeamListDisabled("suspended", "home")).toBe(true);
		expect(isTeamListDisabled("suspended", "away")).toBe(true);
	});

	it("postponed bloquea ambas listas", () => {
		expect(isTeamListDisabled("postponed", "home")).toBe(true);
		expect(isTeamListDisabled("postponed", "away")).toBe(true);
	});

	it("walkover_home (visitante ausente): bloquea away, habilita home", () => {
		expect(isTeamListDisabled("walkover_home", "home")).toBe(false);
		expect(isTeamListDisabled("walkover_home", "away")).toBe(true);
	});

	it("walkover_away (local ausente): bloquea home, habilita away", () => {
		expect(isTeamListDisabled("walkover_away", "home")).toBe(true);
		expect(isTeamListDisabled("walkover_away", "away")).toBe(false);
	});
});
