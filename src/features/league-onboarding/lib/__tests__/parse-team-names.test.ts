import { describe, it, expect } from "vitest";
import { cleanTeamName, splitTeamInput, mergeTeamNames, MAX_TEAMS } from "../parse-team-names";

describe("cleanTeamName", () => {
	it("recorta y colapsa espacios", () => {
		expect(cleanTeamName("  Real   Tijuana ")).toBe("Real Tijuana");
	});
	it("quita numeración de lista", () => {
		expect(cleanTeamName("1. Águilas")).toBe("Águilas");
		expect(cleanTeamName("2) Real Tijuana")).toBe("Real Tijuana");
	});
	it("quita viñetas y comillas envolventes", () => {
		expect(cleanTeamName("- Compadres")).toBe("Compadres");
		expect(cleanTeamName('"Pumas"')).toBe("Pumas");
	});
});

describe("splitTeamInput", () => {
	it("separa por comas", () => {
		expect(splitTeamInput("Águilas, Real Tijuana, Compadres")).toEqual([
			"Águilas",
			"Real Tijuana",
			"Compadres",
		]);
	});
	it("separa por saltos de línea y quita numeración", () => {
		expect(splitTeamInput("1. Águilas\n2. Real Tijuana")).toEqual(["Águilas", "Real Tijuana"]);
	});
	it("devuelve un solo nombre cuando no hay separadores", () => {
		expect(splitTeamInput("Águilas")).toEqual(["Águilas"]);
	});
	it("ignora líneas vacías", () => {
		expect(splitTeamInput("Águilas,,\n , Pumas")).toEqual(["Águilas", "Pumas"]);
	});
});

describe("mergeTeamNames", () => {
	it("deduplica por forma canónica (puntuación/acentos)", () => {
		const r = mergeTeamNames(["Deportivo FC"], ["Deportivo F.C."]);
		expect(r.names).toEqual(["Deportivo FC"]);
		expect(r.duplicates).toEqual(["Deportivo F.C."]);
		expect(r.addedCount).toBe(0);
	});
	it("agrega nombres nuevos únicos", () => {
		const r = mergeTeamNames([], ["Águilas", "Real Tijuana"]);
		expect(r.names).toEqual(["Águilas", "Real Tijuana"]);
		expect(r.addedCount).toBe(2);
	});
	it("deduplica dentro del mismo lote sin importar mayúsculas", () => {
		const r = mergeTeamNames([], ["Pumas", "pumas", "PUMAS"]);
		expect(r.names).toEqual(["Pumas"]);
		expect(r.duplicates.length).toBe(2);
	});
	it("rechaza nombres más largos que el máximo", () => {
		const long = "x".repeat(81);
		const r = mergeTeamNames([], [long]);
		expect(r.names).toEqual([]);
		expect(r.tooLong).toEqual([long]);
	});
	it("respeta el tope de MAX_TEAMS y reporta overflow", () => {
		const many = Array.from({ length: MAX_TEAMS + 10 }, (_, i) => `Equipo ${i}`);
		const r = mergeTeamNames([], many);
		expect(r.names.length).toBe(MAX_TEAMS);
		expect(r.overflow).toBe(10);
	});
});
