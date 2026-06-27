import { describe, it, expect } from "vitest";
import { normalizeStandings } from "./normalize-standings";
import type { ColumnMapping } from "@/entities/narrator/model";

const mapping: ColumnMapping = {
	position: 0,
	team: 1,
	played: null, // se deriva de wins + draws + losses
	wins: 2,
	draws: 3,
	losses: 4,
	goalsFor: 5,
	goalsAgainst: 6,
	points: 7,
};

describe("normalizeStandings", () => {
	it("convierte filas crudas en standings tipados", () => {
		const rows = [["1", "Águilas", "3", "1", "1", "9", "4", "10"]];
		const [row] = normalizeStandings(rows, mapping);

		expect(row.teamName).toBe("águilas"); // sanitizado (lowercase)
		expect(row.position).toBe(1);
		expect(row.wins).toBe(3);
		expect(row.goalsFor).toBe(9);
		expect(row.points).toBe(10);
	});

	it("deriva 'played' cuando no está mapeado", () => {
		const rows = [["1", "Águilas", "3", "1", "1", "9", "4", "10"]];
		const [row] = normalizeStandings(rows, mapping);
		expect(row.played).toBe(5); // 3 + 1 + 1
	});

	it("ignora filas sin nombre de equipo", () => {
		const rows = [
			["", "", "", "", "", "", "", ""],
			["1", "Águilas", "3", "1", "1", "9", "4", "10"],
		];
		expect(normalizeStandings(rows, mapping)).toHaveLength(1);
	});

	it("deduplica equipos por nombre canónico", () => {
		const rows = [
			["1", "Águilas", "3", "1", "1", "9", "4", "10"],
			["2", "ÁGUILAS", "2", "0", "2", "5", "8", "6"],
		];
		expect(normalizeStandings(rows, mapping)).toHaveLength(1);
	});

	it("extrae el entero de celdas con texto extra", () => {
		const rows = [["1", "Águilas", "3", "1", "1", "9", "4", "10 pts"]];
		const [row] = normalizeStandings(rows, mapping);
		expect(row.points).toBe(10);
	});

	it("usa 0 para celdas vacías o no numéricas", () => {
		const rows = [["", "Solo Nombre", "", "x", "", "", "", ""]];
		const [row] = normalizeStandings(rows, mapping);
		expect(row.wins).toBe(0);
		expect(row.points).toBe(0);
		expect(row.position).toBeNull();
	});
});
