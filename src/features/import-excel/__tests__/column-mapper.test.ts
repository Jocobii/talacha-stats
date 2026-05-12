/**
 * __tests__/column-mapper.test.ts
 *
 * Tests unitarios de features/import-excel/column-mapper.ts
 *
 * Cubre:
 *   - normalizeCell: mayúsculas, tildes, espacios
 *   - guessHeaderRow: fila con más celdas no vacías
 *   - autoMapColumns: exact match, partial match, sin duplicados, columnas vacías
 */

import { describe, it, expect } from "vitest";
import { normalizeCell, guessHeaderRow, autoMapColumns } from "../column-mapper";

// ---------------------------------------------------------------------------
// normalizeCell
// ---------------------------------------------------------------------------

describe("normalizeCell", () => {
	it("convierte a mayúsculas", () => {
		expect(normalizeCell("nombre")).toBe("NOMBRE");
	});

	it("elimina tildes", () => {
		expect(normalizeCell("Goles a Favor")).toBe("GOLES A FAVOR");
		expect(normalizeCell("Pérdidos")).toBe("PERDIDOS");
	});

	it("elimina espacios extremos", () => {
		expect(normalizeCell("  equipo  ")).toBe("EQUIPO");
	});

	it("devuelve string vacío intacto", () => {
		expect(normalizeCell("")).toBe("");
	});
});

// ---------------------------------------------------------------------------
// guessHeaderRow
// ---------------------------------------------------------------------------

describe("guessHeaderRow", () => {
	it("devuelve 0 para preview vacío", () => {
		expect(guessHeaderRow([])).toBe(0);
	});

	it("devuelve la fila con más celdas no vacías", () => {
		const preview = [
			["", "", ""],
			["Equipo", "JJ", "PTS", "GF", "GC"],
			["Tigres", "10", "28", "35", "12"],
		];
		expect(guessHeaderRow(preview)).toBe(1);
	});

	it("prefiere la primera fila si hay empate", () => {
		const preview = [
			["A", "B", "C"],
			["1", "2", "3"],
		];
		// ambas tienen 3 — devuelve la primera que alcanza el máximo (índice 0)
		expect(guessHeaderRow(preview)).toBe(0);
	});

	it("no analiza más de 8 filas", () => {
		// fila 9 (índice 8) tiene más celdas pero debe ignorarse
		const preview = Array.from({ length: 10 }, (_, i) =>
			i === 8 ? ["a", "b", "c", "d", "e"] : ["x"],
		);
		expect(guessHeaderRow(preview)).not.toBe(8);
	});
});

// ---------------------------------------------------------------------------
// autoMapColumns — goleadores
// ---------------------------------------------------------------------------

describe("autoMapColumns (goleadores)", () => {
	it("mapea encabezados exactos", () => {
		const headers = ["Nombre", "Equipo", "Goles"];
		const map = autoMapColumns(headers, "goleadores");
		expect(map.rawName).toBe("0");
		expect(map.teamName).toBe("1");
		expect(map.goals).toBe("2");
	});

	it("es case-insensitive y tolera tildes", () => {
		const headers = ["NOMBRE DEL JUGADOR", "Goles a Favor", "PTS"];
		const map = autoMapColumns(headers, "goleadores");
		expect(map.rawName).toBe("0");
	});

	it("no asigna la misma columna a dos campos distintos", () => {
		// "G" podría matchear tanto goals como otros — cada col solo una vez
		const headers = ["G", "Asistencias"];
		const map = autoMapColumns(headers, "goleadores");
		const values = Object.values(map);
		const uniqueValues = new Set(values);
		expect(values.length).toBe(uniqueValues.size);
	});

	it("ignora columnas vacías", () => {
		const headers = ["", "Nombre", ""];
		const map = autoMapColumns(headers, "goleadores");
		expect(map.rawName).toBe("1");
		// la columna vacía (índice 0) no debe asignarse
		expect(Object.values(map)).not.toContain("0");
	});

	it("devuelve mapa vacío si no hay coincidencias", () => {
		const headers = ["Col1", "Col2", "Col3"];
		const map = autoMapColumns(headers, "goleadores");
		expect(Object.keys(map)).toHaveLength(0);
	});
});

// ---------------------------------------------------------------------------
// autoMapColumns — standings
// ---------------------------------------------------------------------------

describe("autoMapColumns (standings)", () => {
	it("mapea la tabla de posiciones con headers típicos", () => {
		const headers = ["Equipo", "JJ", "JG", "JE", "JP", "GF", "GC", "PTS"];
		const map = autoMapColumns(headers, "standings");
		expect(map.teamName).toBe("0");
		expect(map.played).toBe("1");
		expect(map.wins).toBe("2");
		expect(map.draws).toBe("3");
		expect(map.losses).toBe("4");
		expect(map.goalsFor).toBe("5");
		expect(map.goalsAgainst).toBe("6");
		expect(map.points).toBe("7");
	});

	it("mapea variantes en español", () => {
		const headers = [
			"Club",
			"Partidos Jugados",
			"Ganados",
			"Empates",
			"Perdidos",
			"GF",
			"GC",
			"Puntos",
		];
		const map = autoMapColumns(headers, "standings");
		expect(map.teamName).toBe("0");
		expect(map.played).toBe("1");
		expect(map.wins).toBe("2");
		expect(map.draws).toBe("3");
		expect(map.losses).toBe("4");
		expect(map.points).toBe("7");
	});
});
