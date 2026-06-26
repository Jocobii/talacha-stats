/**
 * features/narrator-analysis/model/use-excel-narrator-wizard.ts
 *
 * Orquesta el wizard: reducer puro + mutaciones de red (TanStack Query) +
 * persistencia de la PLANTILLA de mapeo (no de los datos). Los componentes son
 * tontos: reciben estado derivado + callbacks.
 */

"use client";

import { useCallback, useMemo, useReducer } from "react";
import { apiFetch, apiUpload } from "@/shared/api/client";
import { useMutation } from "@tanstack/react-query";
import type {
	CanonicalField,
	ColumnMapping,
	NarratorAnalysis,
	ParseExcelResult,
} from "@/entities/narrator/model";
import { sanitizeToCanonical } from "@/shared/lib/normalize";
import { MAPPING_TEMPLATE_KEY } from "../constants";
import { titleCaseAnalysisNames } from "../lib/map-analysis-view";
import {
	wizardReducer,
	initialWizardState,
	selectHeaders,
	selectDataRows,
	selectStandings,
	isRequiredComplete,
	canAnalyze,
} from "./wizard-reducer";

// ── Persistencia de la plantilla de mapeo (solo el "qué columna es qué") ─────

type MappingTemplate = { signature: string; mapping: ColumnMapping };

function headerSignature(headers: string[]): string {
	return headers.map((h) => sanitizeToCanonical(h ?? "")).join("|");
}

function readTemplate(signature: string): ColumnMapping | null {
	if (typeof window === "undefined") return null;
	try {
		const raw = window.localStorage.getItem(MAPPING_TEMPLATE_KEY);
		if (!raw) return null;
		const parsed = JSON.parse(raw) as MappingTemplate;
		return parsed.signature === signature ? parsed.mapping : null;
	} catch (caughtError) {
		console.error("[wizard] no se pudo leer la plantilla de mapeo", caughtError);
		return null;
	}
}

function saveTemplate(signature: string, mapping: ColumnMapping): void {
	if (typeof window === "undefined") return;
	try {
		const template: MappingTemplate = { signature, mapping };
		window.localStorage.setItem(MAPPING_TEMPLATE_KEY, JSON.stringify(template));
	} catch (caughtError) {
		console.error("[wizard] no se pudo guardar la plantilla de mapeo", caughtError);
	}
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useExcelNarratorWizard() {
	const [state, dispatch] = useReducer(wizardReducer, initialWizardState);

	const parse = useMutation({
		mutationFn: async (file: File) => {
			const formData = new FormData();
			formData.append("file", file);
			const res = await apiUpload<ParseExcelResult>("/api/narrator/excel/parse", formData);
			if (!res.ok) throw new Error(res.error);
			return res.data;
		},
		onSuccess: (result) => {
			const headers = result.grid[result.headerRowIndex] ?? [];
			// Si ya conocemos este formato de otra cancha, reusamos su mapeo.
			const remembered = readTemplate(headerSignature(headers));
			dispatch({
				type: "PARSED",
				grid: result.grid,
				headerRowIndex: result.headerRowIndex,
				mapping: remembered ?? result.suggestedMapping,
			});
		},
	});

	const analyze = useMutation({
		mutationFn: async () => {
			const body = {
				headers: selectHeaders(state),
				rows: selectDataRows(state),
				mapping: state.mapping,
				teamAId: state.teamAId,
				teamBId: state.teamBId,
				leagueName: state.leagueName.trim(),
			};
			const res = await apiFetch<NarratorAnalysis>("/api/narrator/excel/analyze", {
				method: "POST",
				body,
			});
			if (!res.ok) throw new Error(res.error);
			return res.data;
		},
		onSuccess: (data) => {
			saveTemplate(headerSignature(selectHeaders(state)), state.mapping);
			dispatch({ type: "ANALYZED", analysis: titleCaseAnalysisNames(data) });
		},
	});

	// ── Callbacks (componentes tontos) ─────────────────────────────────────────
	const handleFile = useCallback(
		(file: File) => {
			parse.reset();
			parse.mutate(file);
		},
		[parse],
	);

	const setHeaderRow = useCallback(
		(index: number) => dispatch({ type: "SET_HEADER_ROW", index }),
		[],
	);
	const setField = useCallback(
		(field: CanonicalField, columnIndex: number | null) =>
			dispatch({ type: "SET_MAPPING_FIELD", field, columnIndex }),
		[],
	);
	const openMapping = useCallback(() => dispatch({ type: "OPEN_MAPPING" }), []);
	const confirmMapping = useCallback(() => dispatch({ type: "CONFIRM_MAPPING" }), []);
	const selectTeam = useCallback((teamId: string) => dispatch({ type: "SELECT_TEAM", teamId }), []);
	const setLeagueName = useCallback(
		(value: string) => dispatch({ type: "SET_LEAGUE_NAME", value }),
		[],
	);
	const changeTeams = useCallback(() => dispatch({ type: "CHANGE_TEAMS" }), []);
	const back = useCallback(() => dispatch({ type: "BACK" }), []);
	const reset = useCallback(() => {
		parse.reset();
		analyze.reset();
		dispatch({ type: "RESET" });
	}, [parse, analyze]);

	const runAnalysis = useCallback(() => analyze.mutate(), [analyze]);

	// ── Derivados (en render, no en efectos) ───────────────────────────────────
	const derived = useMemo(
		() => ({
			headers: selectHeaders(state),
			dataRows: selectDataRows(state),
			standings: selectStandings(state),
			requiredComplete: isRequiredComplete(state.mapping),
			canAnalyze: canAnalyze(state),
		}),
		[state],
	);

	return {
		state,
		...derived,
		parsing: parse.isPending,
		parseError: parse.error?.message ?? null,
		analyzing: analyze.isPending,
		analyzeError: analyze.error?.message ?? null,
		handleFile,
		setHeaderRow,
		setField,
		openMapping,
		confirmMapping,
		selectTeam,
		setLeagueName,
		runAnalysis,
		changeTeams,
		back,
		reset,
	};
}
