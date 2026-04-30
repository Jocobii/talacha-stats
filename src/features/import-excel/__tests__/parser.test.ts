/**
 * __tests__/parser.test.ts
 *
 * Tests unitarios de features/import-excel/parser.ts
 *
 * Estrategia: construir buffers sintéticos de Excel con ExcelJS
 * (la misma librería que usa el parser internamente) para no depender
 * de archivos .xlsx en el repositorio.
 */

import { describe, it, expect } from "vitest";
import ExcelJS from "exceljs";
import { parseBulkBuffer, ParseError } from "../parser";
import type { GoleadoresRow, StandingsRow } from "../parser";

// ---------------------------------------------------------------------------
// Helper — construir un Buffer de Excel desde una matriz de filas
// ---------------------------------------------------------------------------

async function buildExcel(
	sheets: Array<{
		name: string;
		rows: (string | number | null)[][];
	}>,
): Promise<Buffer> {
	const wb = new ExcelJS.Workbook();
	for (const sheet of sheets) {
		const ws = wb.addWorksheet(sheet.name);
		for (const row of sheet.rows) {
			ws.addRow(row);
		}
	}
	const arrayBuffer = await wb.xlsx.writeBuffer();
	return Buffer.from(arrayBuffer);
}

// ---------------------------------------------------------------------------
// Goleadores — auto-detect
// ---------------------------------------------------------------------------

describe("parseBulkBuffer — goleadores auto-detect", () => {
	it("parsea correctamente columnas estándar en español", async () => {
		const buffer = await buildExcel([
			{
				name: "Jornada 5",
				rows: [
					["Jugador", "Equipo", "Goles", "Asistencias", "PJ"],
					["juan garcia", "deportivo fc", 3, 1, 5],
					["carlos lopez", "atletico", 1, 0, 5],
				],
			},
		]);

		const result = await parseBulkBuffer({ buffer });
		expect(result.type).toBe("goleadores");
		expect(result.jornada).toBe(5);

		const rows = result.rows as GoleadoresRow[];
		expect(rows).toHaveLength(2);

		expect(rows[0].rawName).toBe("juan garcia");
		expect(rows[0].teamName).toBe("deportivo fc");
		expect(rows[0].goals).toBe(3);
		expect(rows[0].assists).toBe(1);
		expect(rows[0].matchesPlayed).toBe(5);
	});

	it("parsea columnas en inglés", async () => {
		const buffer = await buildExcel([
			{
				name: "Sheet1",
				rows: [
					["Player", "Team", "Goals", "Assists"],
					["pedro ramirez", "team a", 2, 0],
				],
			},
		]);

		const result = await parseBulkBuffer({ buffer });
		expect(result.type).toBe("goleadores");
		const rows = result.rows as GoleadoresRow[];
		expect(rows[0].rawName).toBe("pedro ramirez");
		expect(rows[0].goals).toBe(2);
	});

	it("aplica sanitizeName a nombres (trim + lowercase)", async () => {
		const buffer = await buildExcel([
			{
				name: "Sheet1",
				rows: [
					["Jugador", "Equipo", "Goles"],
					["  JUAN  GARCIA  ", "  Deportivo  FC  ", 4],
				],
			},
		]);

		const result = await parseBulkBuffer({ buffer });
		const rows = result.rows as GoleadoresRow[];
		expect(rows[0].rawName).toBe("juan garcia");
		expect(rows[0].teamName).toBe("deportivo fc");
	});

	it("filtra filas vacías", async () => {
		const buffer = await buildExcel([
			{
				name: "Sheet1",
				rows: [
					["Jugador", "Equipo", "Goles"],
					["juan garcia", "deportivo", 2],
					[null, null, null],
					["", "", ""],
					["carlos perez", "atletico", 1],
				],
			},
		]);

		const result = await parseBulkBuffer({ buffer });
		const rows = result.rows as GoleadoresRow[];
		expect(rows).toHaveLength(2);
	});

	it("filtra filas que repiten el encabezado", async () => {
		const buffer = await buildExcel([
			{
				name: "Sheet1",
				rows: [
					["Jugador", "Equipo", "Goles"],
					["Jugador", "Equipo", "Goles"], // encabezado repetido
					["juan garcia", "deportivo", 2],
					["nombre jugador", "equipo", 0], // otra forma de encabezado
				],
			},
		]);

		const result = await parseBulkBuffer({ buffer });
		const rows = result.rows as GoleadoresRow[];
		expect(rows).toHaveLength(1);
		expect(rows[0].rawName).toBe("juan garcia");
	});

	it("filtra filas que son solo números", async () => {
		const buffer = await buildExcel([
			{
				name: "Sheet1",
				rows: [
					["Jugador", "Equipo", "Goles"],
					["1", "deportivo", 5], // nombre es solo número — fila inválida
					["juan garcia", "deportivo", 2],
				],
			},
		]);

		const result = await parseBulkBuffer({ buffer });
		const rows = result.rows as GoleadoresRow[];
		expect(rows).toHaveLength(1);
		expect(rows[0].rawName).toBe("juan garcia");
	});

	it("detecta jornada desde el nombre de la hoja", async () => {
		const buffer = await buildExcel([
			{
				name: "Jornada 12",
				rows: [
					["Jugador", "Goles"],
					["juan garcia", 3],
				],
			},
		]);

		const result = await parseBulkBuffer({ buffer });
		expect(result.jornada).toBe(12);
	});

	it("detecta jornada desde una celda en las primeras 5 filas", async () => {
		const buffer = await buildExcel([
			{
				name: "Estadisticas",
				rows: [
					["Jornada 8", null],
					["Jugador", "Goles"],
					["juan garcia", 2],
				],
			},
		]);

		const result = await parseBulkBuffer({ buffer });
		expect(result.jornada).toBe(8);
	});

	it("jornada es undefined si no se detecta", async () => {
		const buffer = await buildExcel([
			{
				name: "Estadisticas",
				rows: [
					["Jugador", "Goles"],
					["juan garcia", 2],
				],
			},
		]);

		const result = await parseBulkBuffer({ buffer });
		expect(result.jornada).toBeUndefined();
	});
});

// ---------------------------------------------------------------------------
// Standings — auto-detect
// ---------------------------------------------------------------------------

describe("parseBulkBuffer — standings auto-detect", () => {
	it("parsea tabla de posiciones estándar", async () => {
		const buffer = await buildExcel([
			{
				name: "Jornada 6",
				rows: [
					["Equipo", "JJ", "JG", "JE", "JP", "GF", "GC", "Pts"],
					["deportivo fc", 6, 4, 1, 1, 14, 7, 13],
					["atletico", 6, 3, 2, 1, 10, 6, 11],
					["real tijuana", 6, 1, 0, 5, 4, 15, 3],
				],
			},
		]);

		const result = await parseBulkBuffer({ buffer });
		expect(result.type).toBe("standings");

		const rows = result.rows as StandingsRow[];
		expect(rows).toHaveLength(3);
		expect(rows[0].teamName).toBe("deportivo fc");
		expect(rows[0].position).toBe(1);
		expect(rows[0].points).toBe(13);
		expect(rows[0].wins).toBe(4);
		expect(rows[1].position).toBe(2);
	});

	it("filtra filas de zona (liguilla, copa)", async () => {
		const buffer = await buildExcel([
			{
				name: "Sheet1",
				rows: [
					["Equipo", "Pts"],
					["deportivo fc", 13],
					["LIGUILLA", null],
					["atletico", 11],
				],
			},
		]);

		const result = await parseBulkBuffer({ buffer });
		const rows = result.rows as StandingsRow[];
		expect(rows.some((r) => r.teamName === "liguilla")).toBe(false);
	});

	it("asigna posiciones secuencialmente", async () => {
		const buffer = await buildExcel([
			{
				name: "Sheet1",
				rows: [
					["Equipo", "Pts"],
					["equipo a", 10],
					["equipo b", 7],
					["equipo c", 4],
				],
			},
		]);

		const result = await parseBulkBuffer({ buffer });
		const rows = result.rows as StandingsRow[];
		expect(rows.map((r) => r.position)).toEqual([1, 2, 3]);
	});
});

// ---------------------------------------------------------------------------
// Mapeo manual (MappedImportOptions)
// ---------------------------------------------------------------------------

describe("parseBulkBuffer — mapeo manual", () => {
	it("parsea goleadores con mapeo explícito de columnas por índice", async () => {
		const buffer = await buildExcel([
			{
				name: "Datos",
				rows: [
					["Pos", "Nombre", "Club", "G", "A"], // headerRow = 0
					["1", "juan garcia", "deportivo", "5", "2"],
					["2", "carlos lopez", "atletico", "3", "1"],
				],
			},
		]);

		const result = await parseBulkBuffer({
			buffer,
			options: {
				type: "goleadores",
				sheetName: "Datos",
				headerRow: 0,
				columnMap: {
					rawName: "1", // columna índice 1 = "Nombre"
					teamName: "2", // columna índice 2 = "Club"
					goals: "3", // columna índice 3 = "G"
					assists: "4", // columna índice 4 = "A"
				},
				jornada: 3,
			},
		});

		expect(result.type).toBe("goleadores");
		expect(result.jornada).toBe(3);

		const rows = result.rows as GoleadoresRow[];
		expect(rows).toHaveLength(2);
		expect(rows[0].rawName).toBe("juan garcia");
		expect(rows[0].goals).toBe(5);
		expect(rows[0].assists).toBe(2);
	});

	it("lanza ParseError si la hoja no existe", async () => {
		const buffer = await buildExcel([
			{
				name: "Hoja1",
				rows: [
					["Jugador", "Goles"],
					["juan", 1],
				],
			},
		]);

		await expect(
			parseBulkBuffer({
				buffer,
				options: {
					type: "goleadores",
					sheetName: "NoExiste",
					headerRow: 0,
					columnMap: { rawName: "0", goals: "1" },
				},
			}),
		).rejects.toThrow(ParseError);
	});
});

// ---------------------------------------------------------------------------
// ParseError — formato no reconocible
// ---------------------------------------------------------------------------

describe("parseBulkBuffer — errores", () => {
	it("lanza ParseError si el Excel no tiene formato reconocible", async () => {
		const buffer = await buildExcel([
			{
				name: "Hoja1",
				rows: [
					["Columna aleatoria", "Otra columna"],
					["dato1", "dato2"],
				],
			},
		]);

		await expect(parseBulkBuffer({ buffer })).rejects.toThrow(ParseError);
	});

	it("lanza ParseError si todas las hojas están vacías", async () => {
		const buffer = await buildExcel([{ name: "Vacía", rows: [] }]);

		await expect(parseBulkBuffer({ buffer })).rejects.toThrow(ParseError);
	});

	it("la instancia del error tiene name = 'ParseError'", async () => {
		const buffer = await buildExcel([
			{
				name: "Sheet1",
				rows: [
					["X", "Y"],
					["a", "b"],
				],
			},
		]);

		try {
			await parseBulkBuffer({ buffer });
			expect.fail("Debería haber lanzado ParseError");
		} catch (e) {
			expect(e).toBeInstanceOf(ParseError);
			expect((e as ParseError).name).toBe("ParseError");
		}
	});
});
