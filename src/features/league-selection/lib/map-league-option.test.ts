import { describe, it, expect } from "vitest";
import { mapLeagueToOption, type LeagueOptionDto } from "./map-league-option";

function buildLeagueRow(overrides: Partial<LeagueOptionDto> = {}): LeagueOptionDto {
	return { id: "L1", name: "liga brillante", dayOfWeek: "lunes", ...overrides };
}

describe("mapLeagueToOption", () => {
	it("aplica titleCase al nombre y al día y arma el label", () => {
		const option = mapLeagueToOption(
			buildLeagueRow({ name: "liga brillante", dayOfWeek: "lunes" }),
		);
		expect(option).toEqual({ id: "L1", label: "Liga Brillante - Lunes" });
	});

	it("conserva el id sin transformarlo", () => {
		const option = mapLeagueToOption(buildLeagueRow({ id: "abc-123" }));
		expect(option.id).toBe("abc-123");
	});

	it("no expone campos crudos del DTO en el ViewModel", () => {
		const option = mapLeagueToOption(buildLeagueRow());
		expect(option).not.toHaveProperty("name");
		expect(option).not.toHaveProperty("dayOfWeek");
	});
});
