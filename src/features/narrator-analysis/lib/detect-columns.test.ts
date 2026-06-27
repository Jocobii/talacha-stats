import { describe, it, expect } from "vitest";
import { detectColumns } from "./detect-columns";

describe("detectColumns", () => {
	it("mapea encabezados estándar de tabla de posiciones", () => {
		const headers = ["Pos", "Equipo", "PJ", "PG", "PE", "PP", "GF", "GC", "Pts"];
		const mapping = detectColumns(headers);

		expect(mapping.position).toBe(0);
		expect(mapping.team).toBe(1);
		expect(mapping.played).toBe(2);
		expect(mapping.wins).toBe(3);
		expect(mapping.draws).toBe(4);
		expect(mapping.losses).toBe(5);
		expect(mapping.goalsFor).toBe(6);
		expect(mapping.goalsAgainst).toBe(7);
		expect(mapping.points).toBe(8);
	});

	it("tolera acentos, mayúsculas y nombres largos", () => {
		const headers = ["No.", "CLUB", "Goles a Favor", "Goles en Contra", "Puntos"];
		const mapping = detectColumns(headers);

		expect(mapping.position).toBe(0);
		expect(mapping.team).toBe(1);
		expect(mapping.goalsFor).toBe(2);
		expect(mapping.goalsAgainst).toBe(3);
		expect(mapping.points).toBe(4);
	});

	it("deja en null los campos que no encuentra", () => {
		const headers = ["Equipo", "Pts"];
		const mapping = detectColumns(headers);

		expect(mapping.team).toBe(0);
		expect(mapping.points).toBe(1);
		expect(mapping.wins).toBeNull();
		expect(mapping.goalsFor).toBeNull();
	});

	it("no asigna la misma columna a dos campos", () => {
		const headers = ["Equipo", "Pts"];
		const mapping = detectColumns(headers);
		const used = Object.values(mapping).filter((v) => v !== null);
		expect(new Set(used).size).toBe(used.length);
	});

	it("ignora encabezados vacíos sin romperse", () => {
		const headers = ["", "Equipo", "", "Pts"];
		const mapping = detectColumns(headers);
		expect(mapping.team).toBe(1);
		expect(mapping.points).toBe(3);
	});
});
