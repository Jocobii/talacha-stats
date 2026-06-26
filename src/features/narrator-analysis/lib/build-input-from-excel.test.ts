import { describe, it, expect } from "vitest";
import { buildInputFromExcel } from "./build-input-from-excel";
import type { ExcelStandingRow } from "@/entities/narrator/model";

function row(
	over: Partial<ExcelStandingRow> & { teamId: string; teamName: string },
): ExcelStandingRow {
	return {
		position: null,
		played: 0,
		wins: 0,
		draws: 0,
		losses: 0,
		goalsFor: 0,
		goalsAgainst: 0,
		points: 0,
		...over,
	};
}

const standings: ExcelStandingRow[] = [
	row({
		teamId: "aguilas",
		teamName: "aguilas",
		points: 10,
		goalsFor: 9,
		goalsAgainst: 4,
		wins: 3,
		draws: 1,
		losses: 1,
		played: 5,
	}),
	row({
		teamId: "tiburones",
		teamName: "tiburones",
		points: 7,
		goalsFor: 7,
		goalsAgainst: 6,
		wins: 2,
		draws: 1,
		losses: 2,
		played: 5,
	}),
	row({
		teamId: "lobos",
		teamName: "lobos",
		points: 3,
		goalsFor: 3,
		goalsAgainst: 11,
		wins: 1,
		draws: 0,
		losses: 4,
		played: 5,
	}),
];

describe("buildInputFromExcel", () => {
	it("devuelve null si alguno de los equipos no está en la tabla", () => {
		const input = buildInputFromExcel({ standings, teamAId: "aguilas", teamBId: "inexistente" });
		expect(input).toBeNull();
	});

	it("arma el NarratorInput con ambos equipos y la tabla completa", () => {
		const input = buildInputFromExcel({ standings, teamAId: "aguilas", teamBId: "tiburones" });
		expect(input).not.toBeNull();
		expect(input!.teamA.team.name).toBe("aguilas");
		expect(input!.teamB.team.name).toBe("tiburones");
		expect(input!.standings).toHaveLength(3);
		expect(input!.teamA.points).toBe(10);
	});

	it("deja roster, last5 y matches vacíos (la tabla no los trae)", () => {
		const input = buildInputFromExcel({ standings, teamAId: "aguilas", teamBId: "tiburones" })!;
		expect(input.teamA.roster).toEqual([]);
		expect(input.teamA.last5).toEqual([]);
		expect(input.teamA.currentStreak).toBeNull();
		expect(input.matches).toEqual([]);
	});

	it("deriva la posición por puntos cuando la fila no la trae", () => {
		const input = buildInputFromExcel({ standings, teamAId: "aguilas", teamBId: "lobos" })!;
		expect(input.teamA.position).toBe(1); // más puntos
		expect(input.teamB.position).toBe(3); // menos puntos
	});

	it("respeta la posición explícita del Excel si existe", () => {
		const withPos = standings.map((r, i) => ({ ...r, position: i + 1 }));
		const input = buildInputFromExcel({
			standings: withPos,
			teamAId: "aguilas",
			teamBId: "tiburones",
		})!;
		expect(input.teamA.position).toBe(1);
	});

	it("usa nombre de liga por defecto cuando no se provee", () => {
		const input = buildInputFromExcel({ standings, teamAId: "aguilas", teamBId: "tiburones" })!;
		expect(input.league.name).toBe("Liga (Excel)");
	});
});
