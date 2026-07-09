import { describe, it, expect } from "vitest";
import { mapLeagueToSummary } from "./map-league-to-summary";

describe("mapLeagueToSummary", () => {
	it("aplica titleCase al nombre y conserva dayOfWeek/season sin transformar", () => {
		const view = mapLeagueToSummary({
			id: "l1",
			name: "liga brillante",
			season: "Apertura 2026",
			dayOfWeek: "martes",
		});
		expect(view).toEqual({
			id: "l1",
			name: "Liga Brillante",
			season: "Apertura 2026",
			dayOfWeek: "martes",
		});
	});
});
