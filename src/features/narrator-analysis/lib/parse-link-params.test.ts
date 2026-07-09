import { describe, it, expect } from "vitest";
import { parseLinkParams } from "./parse-link-params";

describe("parseLinkParams", () => {
	it("devuelve los tres params cuando están completos", () => {
		const params = new URLSearchParams({
			leagueId: "L1",
			teamA: "t1",
			teamB: "t2",
			city: "Tijuana",
		});
		expect(parseLinkParams(params)).toEqual({ leagueId: "L1", teamA: "t1", teamB: "t2" });
	});

	it("devuelve null si falta leagueId", () => {
		const params = new URLSearchParams({ teamA: "t1", teamB: "t2" });
		expect(parseLinkParams(params)).toBeNull();
	});

	it("devuelve null si falta teamA", () => {
		const params = new URLSearchParams({ leagueId: "L1", teamB: "t2" });
		expect(parseLinkParams(params)).toBeNull();
	});

	it("devuelve null si falta teamB", () => {
		const params = new URLSearchParams({ leagueId: "L1", teamA: "t1" });
		expect(parseLinkParams(params)).toBeNull();
	});

	it("devuelve null sin ningún param", () => {
		expect(parseLinkParams(new URLSearchParams())).toBeNull();
	});
});
