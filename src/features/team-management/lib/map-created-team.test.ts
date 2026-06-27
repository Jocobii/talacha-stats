import { describe, it, expect } from "vitest";
import { mapTeamToCreatedView, type CreatedTeamDto } from "./map-created-team";

function buildTeamRow(overrides: Partial<CreatedTeamDto> = {}): CreatedTeamDto {
	return { id: "t1", name: "deportivo guadalupe", color: "#38a169", ...overrides };
}

describe("mapTeamToCreatedView", () => {
	it("aplica titleCase al nombre crudo y lo expone como displayName", () => {
		const view = mapTeamToCreatedView(buildTeamRow({ name: "deportivo guadalupe" }));
		expect(view.displayName).toBe("Deportivo Guadalupe");
	});

	it("conserva el color cuando viene definido", () => {
		const view = mapTeamToCreatedView(buildTeamRow({ color: "#3182ce" }));
		expect(view.color).toBe("#3182ce");
	});

	it("normaliza color ausente (null) a null", () => {
		const view = mapTeamToCreatedView(buildTeamRow({ color: null }));
		expect(view.color).toBeNull();
	});

	it("no arrastra campos crudos del DTO al ViewModel", () => {
		const view = mapTeamToCreatedView(buildTeamRow());
		expect(view).toEqual({ id: "t1", displayName: "Deportivo Guadalupe", color: "#38a169" });
		expect(view).not.toHaveProperty("name");
	});
});
