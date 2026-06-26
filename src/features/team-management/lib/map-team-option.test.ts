import { describe, it, expect } from "vitest";
import { mapTeamToTeamOption, type TeamOptionDto } from "./map-team-option";

function buildTeamDto(overrides: Partial<TeamOptionDto> = {}): TeamOptionDto {
	return { id: "team-1", name: "Deportivo FC", color: "#38a169", ...overrides };
}

describe("mapTeamToTeamOption", () => {
	it("expone exactamente id, name y color", () => {
		const view = mapTeamToTeamOption(buildTeamDto());
		expect(view).toEqual({ id: "team-1", name: "Deportivo FC", color: "#38a169" });
	});

	it("normaliza color ausente a null", () => {
		const view = mapTeamToTeamOption(buildTeamDto({ color: null }));
		expect(view.color).toBeNull();
	});

	it("no arrastra campos extra de la fila cruda de DB al ViewModel", () => {
		const dtoWithExtra = { ...buildTeamDto(), leagueId: "liga-9", nameCanonical: "deportivo fc" };
		const view = mapTeamToTeamOption(dtoWithExtra);
		expect(Object.keys(view).sort()).toEqual(["color", "id", "name"]);
	});
});
