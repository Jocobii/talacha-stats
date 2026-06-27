/**
 * features/narrator-analysis/model/wizard-reducer.ts
 *
 * Estado del wizard Excel — reducer PURO y testeable (sin React, sin red).
 * Toda la lógica de navegación y de mapeo vive aquí; el hook solo conecta
 * efectos (red, persistencia). Los datos viven en memoria: se limpian al
 * refrescar o subir otro Excel (RESET).
 */

import {
	CANONICAL_FIELDS,
	REQUIRED_FIELDS,
	type CanonicalField,
	type ColumnMapping,
	type NarratorAnalysis,
	type ExcelStandingRow,
} from "@/entities/narrator/model";
import { detectColumns } from "../lib/detect-columns";
import { normalizeStandings } from "../lib/normalize-standings";

export type WizardStep = "upload" | "mapping" | "teams" | "report";

export type WizardState = {
	step: WizardStep;
	grid: string[][] | null;
	headerRowIndex: number;
	mapping: ColumnMapping;
	leagueName: string;
	teamAId: string | null;
	teamBId: string | null;
	analysis: NarratorAnalysis | null;
};

export type WizardAction =
	| { type: "PARSED"; grid: string[][]; headerRowIndex: number; mapping: ColumnMapping }
	| { type: "SET_HEADER_ROW"; index: number }
	| { type: "SET_MAPPING_FIELD"; field: CanonicalField; columnIndex: number | null }
	| { type: "OPEN_MAPPING" }
	| { type: "CONFIRM_MAPPING" }
	| { type: "SELECT_TEAM"; teamId: string }
	| { type: "SET_LEAGUE_NAME"; value: string }
	| { type: "ANALYZED"; analysis: NarratorAnalysis }
	| { type: "CHANGE_TEAMS" }
	| { type: "BACK" }
	| { type: "RESET" };

export const emptyMapping = (): ColumnMapping =>
	Object.fromEntries(CANONICAL_FIELDS.map((f) => [f, null])) as ColumnMapping;

export const initialWizardState: WizardState = {
	step: "upload",
	grid: null,
	headerRowIndex: 0,
	mapping: emptyMapping(),
	leagueName: "",
	teamAId: null,
	teamBId: null,
	analysis: null,
};

export function wizardReducer(state: WizardState, action: WizardAction): WizardState {
	switch (action.type) {
		case "PARSED": {
			const next = {
				...state,
				grid: action.grid,
				headerRowIndex: action.headerRowIndex,
				mapping: action.mapping,
				teamAId: null,
				teamBId: null,
				analysis: null,
			};
			// Camino más corto: si la autodetección resolvió lo obligatorio,
			// saltamos el mapeo y vamos directo a elegir equipos.
			return { ...next, step: isRequiredComplete(action.mapping) ? "teams" : "mapping" };
		}

		case "SET_HEADER_ROW": {
			if (!state.grid) return state;
			const headers = state.grid[action.index] ?? [];
			return { ...state, headerRowIndex: action.index, mapping: detectColumns(headers) };
		}

		case "SET_MAPPING_FIELD":
			return { ...state, mapping: assignColumn(state.mapping, action.field, action.columnIndex) };

		case "OPEN_MAPPING":
			return state.grid ? { ...state, step: "mapping" } : state;

		case "CONFIRM_MAPPING":
			return isRequiredComplete(state.mapping) ? { ...state, step: "teams" } : state;

		case "SELECT_TEAM":
			return { ...state, ...nextTeamSelection(state, action.teamId) };

		case "SET_LEAGUE_NAME":
			return { ...state, leagueName: action.value };

		case "ANALYZED":
			return { ...state, analysis: action.analysis, step: "report" };

		// Volver a elegir equipos con el MISMO Excel ya parseado (sin re-subir).
		// Conserva grid/mapping/selección; solo regresa al paso de equipos.
		case "CHANGE_TEAMS":
			return state.grid ? { ...state, step: "teams" } : state;

		case "BACK":
			return { ...state, step: previousStep(state.step) };

		case "RESET":
			return initialWizardState;

		default:
			return state;
	}
}

// ── Reglas de mapeo ─────────────────────────────────────────────────────────

/** Asigna una columna a un campo y la quita de cualquier otro campo (1 col → 1 campo). */
function assignColumn(
	mapping: ColumnMapping,
	field: CanonicalField,
	columnIndex: number | null,
): ColumnMapping {
	const next = { ...mapping };
	if (columnIndex !== null) {
		for (const f of CANONICAL_FIELDS) {
			if (next[f] === columnIndex) next[f] = null;
		}
	}
	next[field] = columnIndex;
	return next;
}

// ── Selección de equipos (tap para asignar A, luego B; re-tap deselecciona) ──

function nextTeamSelection(
	state: WizardState,
	teamId: string,
): Pick<WizardState, "teamAId" | "teamBId"> {
	if (teamId === state.teamAId) return { teamAId: null, teamBId: state.teamBId };
	if (teamId === state.teamBId) return { teamAId: state.teamAId, teamBId: null };
	if (state.teamAId === null) return { teamAId: teamId, teamBId: state.teamBId };
	if (state.teamBId === null) return { teamAId: state.teamAId, teamBId: teamId };
	return { teamAId: state.teamAId, teamBId: state.teamBId }; // ambos llenos: ignorar
}

function previousStep(step: WizardStep): WizardStep {
	if (step === "report") return "teams";
	return "upload";
}

// ── Selectores derivados (calculados en render, nunca en efectos §7.2) ───────

export function selectHeaders(state: WizardState): string[] {
	return state.grid ? (state.grid[state.headerRowIndex] ?? []) : [];
}

export function selectDataRows(state: WizardState): string[][] {
	return state.grid ? state.grid.slice(state.headerRowIndex + 1) : [];
}

export function selectStandings(state: WizardState): ExcelStandingRow[] {
	return normalizeStandings(selectDataRows(state), state.mapping);
}

export function isRequiredComplete(mapping: ColumnMapping): boolean {
	return REQUIRED_FIELDS.every((f) => mapping[f] !== null);
}

export function canAnalyze(state: WizardState): boolean {
	return (
		isRequiredComplete(state.mapping) &&
		state.teamAId !== null &&
		state.teamBId !== null &&
		state.leagueName.trim() !== ""
	);
}
