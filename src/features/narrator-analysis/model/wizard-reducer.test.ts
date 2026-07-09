import { describe, it, expect } from "vitest";
import {
	wizardReducer,
	initialWizardState,
	emptyMapping,
	canAnalyze,
	selectStandings,
	type WizardState,
} from "./wizard-reducer";
import type { ColumnMapping } from "@/entities/narrator/model";

function completeMapping(): ColumnMapping {
	return { ...emptyMapping(), team: 1, points: 8, goalsFor: 6, goalsAgainst: 7 };
}

const grid = [
	["Pos", "Equipo", "PJ", "G", "E", "P", "GF", "GC", "Pts"],
	["1", "Pumas", "10", "8", "1", "1", "61", "24", "25"],
	["2", "Santos", "10", "7", "2", "1", "58", "34", "23"],
];

describe("wizardReducer — mapeo", () => {
	const base: WizardState = {
		...initialWizardState,
		grid,
		headerRowIndex: 0,
		mapping: completeMapping(),
	};

	it("una columna solo puede pertenecer a un campo", () => {
		// asignar la columna 8 (ya en points) a 'wins' debe quitarla de points
		const next = wizardReducer(base, { type: "SET_MAPPING_FIELD", field: "wins", columnIndex: 8 });
		expect(next.mapping.wins).toBe(8);
		expect(next.mapping.points).toBeNull();
	});

	it("SET_HEADER_ROW re-detecta el mapeo de esa fila", () => {
		const next = wizardReducer(base, { type: "SET_HEADER_ROW", index: 0 });
		expect(next.headerRowIndex).toBe(0);
		expect(next.mapping.team).toBe(1); // "Equipo"
		expect(next.mapping.points).toBe(8); // "Pts"
	});

	it("CONFIRM_MAPPING avanza solo si lo obligatorio está completo", () => {
		expect(wizardReducer(base, { type: "CONFIRM_MAPPING" }).step).toBe("teams");
		const incomplete = { ...base, mapping: { ...completeMapping(), team: null } };
		expect(wizardReducer(incomplete, { type: "CONFIRM_MAPPING" }).step).toBe("upload");
	});
});

describe("wizardReducer — selección de equipos", () => {
	const base: WizardState = {
		...initialWizardState,
		grid,
		headerRowIndex: 0,
		mapping: completeMapping(),
		leagueName: "Liga Test",
	};

	it("asigna A, luego B, y re-tap deselecciona", () => {
		let s = wizardReducer(base, { type: "SELECT_TEAM", teamId: "pumas" });
		expect(s.teamAId).toBe("pumas");
		s = wizardReducer(s, { type: "SELECT_TEAM", teamId: "santos" });
		expect(s.teamBId).toBe("santos");
		s = wizardReducer(s, { type: "SELECT_TEAM", teamId: "pumas" });
		expect(s.teamAId).toBeNull();
	});

	it("canAnalyze requiere mapeo completo + dos equipos + nombre de liga", () => {
		let s = wizardReducer(base, { type: "SELECT_TEAM", teamId: "pumas" });
		expect(canAnalyze(s)).toBe(false);
		s = wizardReducer(s, { type: "SELECT_TEAM", teamId: "santos" });
		expect(canAnalyze(s)).toBe(true);
		// Sin nombre de liga no se puede analizar (métrica comercial obligatoria).
		expect(canAnalyze({ ...s, leagueName: "  " })).toBe(false);
	});
});

describe("wizardReducer — selectores y reset", () => {
	it("selectStandings normaliza las filas de datos según el mapeo", () => {
		const s: WizardState = {
			...initialWizardState,
			grid,
			headerRowIndex: 0,
			mapping: completeMapping(),
		};
		const standings = selectStandings(s);
		expect(standings).toHaveLength(2);
		expect(standings[0].teamName).toBe("pumas");
		expect(standings[0].points).toBe(25);
	});

	it("RESET vuelve al estado inicial", () => {
		const dirty: WizardState = { ...initialWizardState, step: "report", teamAId: "x" };
		expect(wizardReducer(dirty, { type: "RESET" })).toEqual(initialWizardState);
	});
});
