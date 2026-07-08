import { describe, it, expect } from "vitest";
import { mapTeamToTeamOption, type TeamOptionDto } from "./map-team-option";

function buildTeamRow(overrides: Partial<TeamOptionDto> = {}): TeamOptionDto {
	return { id: "t1", name: "Deportivo Alfa", ...overrides };
}

describe("mapTeamToTeamOption", () => {
	it("conserva id y name", () => {
		const option = mapTeamToTeamOption(buildTeamRow({ id: "t9", name: "Beta FC" }));
		expect(option).toEqual({ id: "t9", name: "Beta FC" });
	});

	it("no expone campos crudos fuera de id/name", () => {
		const option = mapTeamToTeamOption(buildTeamRow());
		expect(Object.keys(option).sort()).toEqual(["id", "name"]);
	});
});
