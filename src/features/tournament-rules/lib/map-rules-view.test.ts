import { describe, expect, it } from "vitest";
import type { LeagueConfigDto } from "@/entities/league-config";
import { mapLeagueConfigToRulesView } from "./map-rules-view";

function buildDto(overrides: Partial<LeagueConfigDto> = {}): LeagueConfigDto {
	return {
		leagueId: "l1",
		pointsWin: 3,
		pointsDraw: 1,
		tiebreakers: ["points", "head_to_head", "goal_diff", "goals_for", "name"],
		yellowThreshold: 5,
		redCardMatches: 1,
		blueCardMeaning: "temp",
		reinforcementLimit: 3,
		financeLevel: 0,
		lockedAt: null,
		...overrides,
	};
}

describe("mapLeagueConfigToRulesView", () => {
	it("expone los 4 criterios de desempate sin 'name'", () => {
		const view = mapLeagueConfigToRulesView(buildDto());
		expect(view.tiebreakers).toEqual(["points", "head_to_head", "goal_diff", "goals_for"]);
		expect(view.tiebreakers).not.toContain("name");
	});

	it("respeta el orden custom guardado", () => {
		const view = mapLeagueConfigToRulesView(
			buildDto({ tiebreakers: ["goal_diff", "points", "goals_for", "head_to_head", "name"] }),
		);
		expect(view.tiebreakers).toEqual(["goal_diff", "points", "goals_for", "head_to_head"]);
	});

	it("completa criterios faltantes al final (dato viejo/corrupto)", () => {
		const view = mapLeagueConfigToRulesView(buildDto({ tiebreakers: ["points", "name"] }));
		expect(view.tiebreakers).toHaveLength(4);
		expect(view.tiebreakers[0]).toBe("points");
		expect(new Set(view.tiebreakers).size).toBe(4);
	});

	it("isLocked es false cuando lockedAt es null", () => {
		expect(mapLeagueConfigToRulesView(buildDto()).isLocked).toBe(false);
	});

	it("isLocked es true cuando lockedAt tiene fecha", () => {
		const view = mapLeagueConfigToRulesView(buildDto({ lockedAt: new Date("2026-07-01") }));
		expect(view.isLocked).toBe(true);
	});

	it("reinforcementLimit null significa sin límite", () => {
		const view = mapLeagueConfigToRulesView(buildDto({ reinforcementLimit: null }));
		expect(view.reinforcementLimit).toBeNull();
	});

	it("propaga blueCardMeaning y financeLevel tal cual", () => {
		const view = mapLeagueConfigToRulesView(
			buildDto({ blueCardMeaning: "yellow", financeLevel: 2 }),
		);
		expect(view.blueCardMeaning).toBe("yellow");
		expect(view.financeLevel).toBe(2);
	});
});
