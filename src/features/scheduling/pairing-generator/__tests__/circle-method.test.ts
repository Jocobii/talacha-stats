import { describe, it, expect } from "vitest";
import { generateRoundRobin } from "../circle-method";
import { pairKey } from "../../lib/pair-key";

const teams6 = ["A", "B", "C", "D", "E", "F"];
const teams5 = ["A", "B", "C", "D", "E"];

describe("generateRoundRobin — N par (6 equipos)", () => {
	const rounds = generateRoundRobin(teams6, 42);

	it("produce N-1 jornadas", () => {
		expect(rounds).toHaveLength(5);
	});

	it("cada jornada tiene N/2 pairings", () => {
		rounds.forEach((r) => expect(r).toHaveLength(3));
	});

	it("cada equipo aparece exactamente una vez por jornada", () => {
		rounds.forEach((round) => {
			const seen = new Set<string>();
			for (const p of round) {
				expect(seen.has(p.homeTeamId)).toBe(false);
				seen.add(p.homeTeamId);
				if (p.awayTeamId) {
					expect(seen.has(p.awayTeamId)).toBe(false);
					seen.add(p.awayTeamId);
				}
			}
		});
	});

	it("ningún par real se repite (S4)", () => {
		const keys = new Set<string>();
		rounds.forEach((round) => {
			round.forEach((p) => {
				if (!p.awayTeamId) return;
				const key = pairKey(p.homeTeamId, p.awayTeamId);
				expect(keys.has(key), `Par duplicado: ${key}`).toBe(false);
				keys.add(key);
			});
		});
	});

	it("cubre todos los C(N,2) pares posibles", () => {
		const keys = new Set<string>();
		rounds.forEach((r) =>
			r.forEach((p) => {
				if (p.awayTeamId) keys.add(pairKey(p.homeTeamId, p.awayTeamId));
			}),
		);
		expect(keys.size).toBe((6 * 5) / 2);
	});
});

describe("generateRoundRobin — N impar (5 equipos)", () => {
	const rounds = generateRoundRobin(teams5, 99);

	it("produce N jornadas", () => {
		expect(rounds).toHaveLength(5);
	});

	it("cada jornada tiene exactamente 1 BYE", () => {
		rounds.forEach((round) => {
			const byes = round.filter((p) => p.awayTeamId === null);
			expect(byes).toHaveLength(1);
		});
	});

	it("cada equipo descansa exactamente una vez", () => {
		const restCount = new Map<string, number>();
		rounds.forEach((round) => {
			round.forEach((p) => {
				if (p.awayTeamId === null) {
					restCount.set(p.homeTeamId, (restCount.get(p.homeTeamId) ?? 0) + 1);
				}
			});
		});
		for (const c of restCount.values()) expect(c).toBe(1);
		expect(restCount.size).toBe(5);
	});
});

describe("generateRoundRobin — reproducibilidad", () => {
	it("mismo seed produce el mismo sorteo", () => {
		const r1 = generateRoundRobin(teams6, 1234);
		const r2 = generateRoundRobin(teams6, 1234);
		expect(JSON.stringify(r1)).toBe(JSON.stringify(r2));
	});

	it("seeds distintos producen sorteos distintos", () => {
		const r1 = generateRoundRobin(teams6, 1);
		const r2 = generateRoundRobin(teams6, 2);
		expect(JSON.stringify(r1)).not.toBe(JSON.stringify(r2));
	});

	it("N=2 produce 1 jornada con 1 partido", () => {
		const rounds = generateRoundRobin(["X", "Y"], 7);
		expect(rounds).toHaveLength(1);
		expect(rounds[0]).toHaveLength(1);
		expect(rounds[0]![0]!.awayTeamId).not.toBeNull();
	});
});
