"use client";

/**
 * features/import-excel/hooks/useImportWizard.ts
 *
 * Hook central del wizard de importación.
 *
 * Consolida el estado disperso (~22 useState) en un único useReducer cuyas
 * transiciones modelan el flujo: upload → map → preview → done.
 *
 * Expone:
 *   state    → estado actual (readonly, derivado del reducer)
 *   derived  → valores computados (no guardar en estado lo que se puede calcular)
 *   handlers → funciones que despachan acciones o llaman APIs
 *
 * El componente raíz ImportWizard solo conecta este hook con los componentes
 * de cada paso — cero lógica en la UI.
 */

import { useReducer, useEffect, useCallback } from "react";
import { guessHeaderRow, autoMapColumns } from "../column-mapper";
import { getFieldsForType } from "../model";
import type { ImportStep, ImportTemplate, BulkPreviewResult, ImportResult } from "../model";
import type { ColumnMap } from "../parser";
import type { PlayerResolution } from "../resolver";

// ---------------------------------------------------------------------------
// State shape
// ---------------------------------------------------------------------------

type WizardState = {
	step: ImportStep;

	// — Paso 1: upload —
	leagueId: string;
	importType: "goleadores" | "standings";
	jornada: string;
	file: File | null;

	// — Paso 2: map —
	sheets: string[];
	activeSheet: string;
	excelPreview: string[][];
	headerRow: number;
	columnMap: ColumnMap;
	templates: ImportTemplate[];
	selectedTemplate: string;
	newTemplateName: string;
	savingTemplate: boolean;
	templateSaved: boolean;

	// — Paso 3: preview —
	preview: BulkPreviewResult | null;
	excludedRows: Set<string>;
	resolutions: Record<string, string>;

	// — Paso 4: done —
	result: ImportResult | null;
	copiedIdx: number | null;

	// — Cross-step —
	loading: boolean;
	error: string;
};

const INITIAL_STATE: WizardState = {
	step: "upload",
	leagueId: "",
	importType: "goleadores",
	jornada: "",
	file: null,
	sheets: [],
	activeSheet: "",
	excelPreview: [],
	headerRow: 0,
	columnMap: {},
	templates: [],
	selectedTemplate: "",
	newTemplateName: "",
	savingTemplate: false,
	templateSaved: false,
	preview: null,
	excludedRows: new Set(),
	resolutions: {},
	result: null,
	copiedIdx: null,
	loading: false,
	error: "",
};

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

type Action =
	| { type: "SET_LEAGUE"; leagueId: string }
	| { type: "SET_IMPORT_TYPE"; importType: "goleadores" | "standings" }
	| { type: "SET_JORNADA"; jornada: string }
	| { type: "SET_FILE"; file: File | null }
	| { type: "SET_TEMPLATES"; templates: ImportTemplate[] }
	| { type: "APPLY_TEMPLATE"; template: ImportTemplate }
	| { type: "SET_NEW_TEMPLATE_NAME"; name: string }
	| { type: "SAVING_TEMPLATE" }
	| { type: "TEMPLATE_SAVED"; templates: ImportTemplate[] }
	| {
			type: "DETECT_SUCCESS";
			sheets: string[];
			activeSheet: string;
			preview: string[][];
			headerRow: number;
			columnMap: ColumnMap;
	  }
	| { type: "SHEET_CHANGE_SUCCESS"; preview: string[][]; headerRow: number; columnMap: ColumnMap }
	| { type: "SET_HEADER_ROW"; row: number; columnMap: ColumnMap }
	| { type: "SET_COLUMN_MAP"; columnMap: ColumnMap }
	| { type: "PREVIEW_SUCCESS"; preview: BulkPreviewResult; resolutions: Record<string, string> }
	| { type: "TOGGLE_EXCLUDED_ROW"; key: string }
	| { type: "CLEAR_EXCLUDED_ROWS" }
	| { type: "SET_RESOLUTION"; rawName: string; playerId: string }
	| { type: "CONFIRM_SUCCESS"; result: ImportResult }
	| { type: "SET_COPIED_IDX"; idx: number | null }
	| { type: "NAVIGATE"; step: ImportStep }
	| { type: "SET_LOADING"; loading: boolean }
	| { type: "SET_ERROR"; error: string }
	| { type: "RESET" };

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

function wizardReducer(state: WizardState, action: Action): WizardState {
	switch (action.type) {
		case "SET_LEAGUE":
			return { ...state, leagueId: action.leagueId };

		case "SET_IMPORT_TYPE":
			return {
				...state,
				importType: action.importType,
				selectedTemplate: "",
				// Recalcular mapeo automático al cambiar el tipo — elimina el useEffect con deps ignoradas
				columnMap:
					state.excelPreview.length > 0
						? autoMapColumns(state.excelPreview[state.headerRow] ?? [], action.importType)
						: {},
			};

		case "SET_JORNADA":
			return { ...state, jornada: action.jornada };

		case "SET_FILE":
			return { ...state, file: action.file, selectedTemplate: "" };

		case "SET_TEMPLATES":
			return { ...state, templates: action.templates };

		case "APPLY_TEMPLATE":
			return {
				...state,
				selectedTemplate: action.template.id,
				importType: action.template.type,
				headerRow: action.template.headerRow,
				columnMap: (() => {
					try {
						return JSON.parse(action.template.columnMap) as ColumnMap;
					} catch {
						return state.columnMap;
					}
				})(),
			};

		case "SET_NEW_TEMPLATE_NAME":
			return { ...state, newTemplateName: action.name };

		case "SAVING_TEMPLATE":
			return { ...state, savingTemplate: true };

		case "TEMPLATE_SAVED":
			return {
				...state,
				savingTemplate: false,
				templateSaved: true,
				newTemplateName: "",
				templates: action.templates,
			};

		case "DETECT_SUCCESS":
			return {
				...state,
				sheets: action.sheets,
				activeSheet: action.activeSheet,
				excelPreview: action.preview,
				headerRow: action.headerRow,
				columnMap: action.columnMap,
				step: "map",
				loading: false,
				error: "",
			};

		case "SHEET_CHANGE_SUCCESS":
			return {
				...state,
				excelPreview: action.preview,
				headerRow: action.headerRow,
				columnMap: action.columnMap,
				loading: false,
			};

		case "SET_HEADER_ROW":
			return { ...state, headerRow: action.row, columnMap: action.columnMap };

		case "SET_COLUMN_MAP":
			return { ...state, columnMap: action.columnMap };

		case "PREVIEW_SUCCESS":
			return {
				...state,
				preview: action.preview,
				resolutions: action.resolutions,
				excludedRows: new Set(),
				step: "preview",
				loading: false,
				error: "",
			};

		case "TOGGLE_EXCLUDED_ROW": {
			const next = new Set(state.excludedRows);
			next.has(action.key) ? next.delete(action.key) : next.add(action.key);
			return { ...state, excludedRows: next };
		}

		case "CLEAR_EXCLUDED_ROWS":
			return { ...state, excludedRows: new Set() };

		case "SET_RESOLUTION":
			return {
				...state,
				resolutions: { ...state.resolutions, [action.rawName]: action.playerId },
			};

		case "CONFIRM_SUCCESS":
			return { ...state, result: action.result, step: "done", loading: false, error: "" };

		case "SET_COPIED_IDX":
			return { ...state, copiedIdx: action.idx };

		case "NAVIGATE":
			return { ...state, step: action.step, error: "" };

		case "SET_LOADING":
			return { ...state, loading: action.loading };

		case "SET_ERROR":
			return { ...state, error: action.error, loading: false };

		case "RESET":
			return { ...INITIAL_STATE, templates: state.templates };

		default:
			return state;
	}
}

// ---------------------------------------------------------------------------
// Derived state helpers
// ---------------------------------------------------------------------------

function buildDerived(state: WizardState) {
	const headerCols = state.excelPreview[state.headerRow] ?? [];
	const fields = getFieldsForType(state.importType);
	const mappedCount = Object.keys(state.columnMap).length;
	const requiredFields = fields.filter((f) => f.required);
	const reqMapped = requiredFields.filter((f) => state.columnMap[f.key] !== undefined).length;
	const allReqDone = reqMapped === requiredFields.length;

	const allSameCols = headerCols.length > 1 && headerCols.every((c) => c === headerCols[0]);
	const hasGoodHeaders =
		headerCols.length === 0 || (!allSameCols && headerCols.some((c) => c && c !== headerCols[0]));

	const relevantTemplates = state.templates.filter((t) => t.type === state.importType);

	// Goleadores preview
	const playerResolutions = state.preview?.playerResolutions ?? [];
	const ambiguous = playerResolutions.filter((p) => !p.found && p.candidates.length > 0);
	const confirmed = playerResolutions.filter((p) => p.found);
	const newPlayers = playerResolutions.filter((p) => !p.found && p.candidates.length === 0);
	const pendingCount = ambiguous.filter((p) => !state.resolutions[p.rawName]).length;
	const allResolved = pendingCount === 0;

	return {
		headerCols,
		fields,
		mappedCount,
		allReqDone,
		hasGoodHeaders,
		relevantTemplates,
		ambiguous,
		confirmed,
		newPlayers,
		pendingCount,
		allResolved,
	};
}

// ---------------------------------------------------------------------------
// Hook API
// ---------------------------------------------------------------------------

export type UseImportWizardReturn = {
	state: WizardState;
	derived: ReturnType<typeof buildDerived>;
	handlers: {
		setLeagueId: (id: string) => void;
		setImportType: (type: "goleadores" | "standings") => void;
		setJornada: (value: string) => void;
		setFile: (file: File | null) => void;
		setColumnMap: (map: ColumnMap) => void;
		setNewTemplateName: (name: string) => void;
		applyTemplate: (templateId: string) => void;
		setHeaderRow: (row: number, cols: string[]) => void;
		setResolution: (rawName: string, playerId: string) => void;
		toggleExcludedRow: (key: string) => void;
		clearExcludedRows: () => void;
		setCopiedIdx: (idx: number | null) => void;
		navigate: (step: ImportStep) => void;
		handleDetect: () => Promise<void>;
		handleSheetChange: (sheet: string) => Promise<void>;
		handlePreview: () => Promise<void>;
		handleSaveTemplate: () => Promise<void>;
		handleConfirm: () => Promise<void>;
		reset: () => void;
	};
};

export function useImportWizard(): UseImportWizardReturn {
	const [state, dispatch] = useReducer(wizardReducer, INITIAL_STATE);

	// ── API helpers ──────────────────────────────────────────────────────────

	async function loadTemplates() {
		const res = await fetch("/api/import/templates");
		if (res.ok) {
			const data = (await res.json()) as { data?: ImportTemplate[] };
			dispatch({ type: "SET_TEMPLATES", templates: data.data ?? [] });
		}
	}

	useEffect(() => {
		loadTemplates();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// ── Simple setters ───────────────────────────────────────────────────────

	const setLeagueId = useCallback((leagueId: string) => {
		dispatch({ type: "SET_LEAGUE", leagueId });
	}, []);

	const setImportType = useCallback((importType: "goleadores" | "standings") => {
		dispatch({ type: "SET_IMPORT_TYPE", importType });
	}, []);

	const setJornada = useCallback((jornada: string) => {
		dispatch({ type: "SET_JORNADA", jornada });
	}, []);

	const setFile = useCallback((file: File | null) => {
		dispatch({ type: "SET_FILE", file });
	}, []);

	const setColumnMap = useCallback((columnMap: ColumnMap) => {
		dispatch({ type: "SET_COLUMN_MAP", columnMap });
	}, []);

	const setNewTemplateName = useCallback((name: string) => {
		dispatch({ type: "SET_NEW_TEMPLATE_NAME", name });
	}, []);

	const applyTemplate = useCallback(
		(templateId: string) => {
			const template = state.templates.find((t: ImportTemplate) => t.id === templateId);
			if (template) dispatch({ type: "APPLY_TEMPLATE", template });
		},
		[state.templates],
	);

	const setHeaderRow = useCallback(
		(row: number, cols: string[]) => {
			dispatch({
				type: "SET_HEADER_ROW",
				row,
				columnMap: autoMapColumns(cols, state.importType),
			});
			// eslint-disable-next-line react-hooks/exhaustive-deps
		},
		[state.importType],
	);

	const setResolution = useCallback((rawName: string, playerId: string) => {
		dispatch({ type: "SET_RESOLUTION", rawName, playerId });
	}, []);

	const toggleExcludedRow = useCallback((key: string) => {
		dispatch({ type: "TOGGLE_EXCLUDED_ROW", key });
	}, []);

	const clearExcludedRows = useCallback(() => {
		dispatch({ type: "CLEAR_EXCLUDED_ROWS" });
	}, []);

	const setCopiedIdx = useCallback((idx: number | null) => {
		dispatch({ type: "SET_COPIED_IDX", idx });
	}, []);

	const navigate = useCallback((step: ImportStep) => {
		dispatch({ type: "NAVIGATE", step });
	}, []);

	const reset = useCallback(() => {
		dispatch({ type: "RESET" });
	}, []);

	// ── Async handlers ───────────────────────────────────────────────────────

	const handleDetect = useCallback(async () => {
		if (!state.file || !state.leagueId) {
			dispatch({ type: "SET_ERROR", error: "Selecciona una liga y un archivo." });
			return;
		}
		dispatch({ type: "SET_LOADING", loading: true });
		try {
			const fd = new FormData();
			fd.append("file", state.file!);
			if (state.activeSheet) fd.append("sheet", state.activeSheet);
			const res = await fetch("/api/import/detect", { method: "POST", body: fd });
			const data = (await res.json()) as {
				ok: boolean;
				error?: string;
				data?: { sheets: string[]; activeSheet: string; preview: string[][] };
			};
			if (!data.ok || !data.data) {
				dispatch({ type: "SET_ERROR", error: data.error ?? "Error desconocido" });
				return;
			}
			const hRow = guessHeaderRow(data.data.preview);
			dispatch({
				type: "DETECT_SUCCESS",
				sheets: data.data.sheets,
				activeSheet: data.data.activeSheet,
				preview: data.data.preview,
				headerRow: hRow,
				columnMap: autoMapColumns(data.data.preview[hRow] ?? [], state.importType),
			});
		} finally {
			dispatch({ type: "SET_LOADING", loading: false });
		}
	}, [state.file, state.leagueId, state.activeSheet, state.importType]);

	const handleSheetChange = useCallback(
		async (sheet: string) => {
			if (!state.file) return;
			dispatch({ type: "SET_LOADING", loading: true });
			try {
				const fd = new FormData();
				fd.append("file", state.file!);
				fd.append("sheet", sheet);
				const res = await fetch("/api/import/detect", { method: "POST", body: fd });
				const data = (await res.json()) as {
					ok: boolean;
					data?: { preview: string[][] };
				};
				if (data.ok && data.data) {
					const hRow = guessHeaderRow(data.data.preview);
					dispatch({
						type: "SHEET_CHANGE_SUCCESS",
						preview: data.data.preview,
						headerRow: hRow,
						columnMap: autoMapColumns(data.data.preview[hRow] ?? [], state.importType),
					});
				}
			} finally {
				dispatch({ type: "SET_LOADING", loading: false });
			}
		},
		[state.file, state.importType],
	);

	const handlePreview = useCallback(async () => {
		const fields = getFieldsForType(state.importType);
		const missing = fields.filter((f) => f.required && !state.columnMap[f.key]);
		if (missing.length > 0) {
			dispatch({
				type: "SET_ERROR",
				error: `Faltan columnas requeridas: ${missing.map((f) => f.label).join(", ")}`,
			});
			return;
		}
		if (!state.leagueId.trim()) {
			dispatch({ type: "SET_ERROR", error: "Falta el ID de liga." });
			return;
		}
		if (state.importType === "goleadores" && !state.jornada.trim()) {
			dispatch({
				type: "SET_ERROR",
				error:
					"El número de jornada es obligatorio para registrar el historial y calcular posiciones ganadas/perdidas.",
			});
			return;
		}
		dispatch({ type: "SET_LOADING", loading: true });
		try {
			const fd = new FormData();
			fd.append("file", state.file!);
			fd.append("league_id", state.leagueId.trim());
			fd.append("action", "preview");
			fd.append(
				"mapping",
				JSON.stringify({
					type: state.importType,
					sheetName: state.activeSheet,
					headerRow: state.headerRow,
					columnMap: state.columnMap,
					jornada: state.jornada ? parseInt(state.jornada) : undefined,
				}),
			);
			const res = await fetch("/api/import/bulk", { method: "POST", body: fd });
			const data = (await res.json()) as { ok: boolean; error?: string; data?: BulkPreviewResult };
			if (!data.ok || !data.data) {
				dispatch({ type: "SET_ERROR", error: data.error ?? "Error desconocido" });
				return;
			}
			// Auto-resolver jugadores sin ambigüedad
			const auto: Record<string, string> = {};
			if (data.data.type === "goleadores" && data.data.playerResolutions) {
				for (const pm of data.data.playerResolutions) {
					if (pm.found && pm.playerId) auto[pm.rawName] = pm.playerId;
					else if (!pm.found && pm.candidates.length === 0) auto[pm.rawName] = "NEW";
				}
			}
			dispatch({ type: "PREVIEW_SUCCESS", preview: data.data, resolutions: auto });
		} finally {
			dispatch({ type: "SET_LOADING", loading: false });
		}
	}, [
		state.file,
		state.importType,
		state.columnMap,
		state.leagueId,
		state.jornada,
		state.activeSheet,
		state.headerRow,
	]);

	const handleSaveTemplate = useCallback(async () => {
		if (!state.newTemplateName.trim()) return;
		dispatch({ type: "SAVING_TEMPLATE" });
		try {
			const res = await fetch("/api/import/templates", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name: state.newTemplateName,
					type: state.importType,
					headerRow: state.headerRow,
					columnMap: state.columnMap,
				}),
			});
			if (res.ok) {
				const freshRes = await fetch("/api/import/templates");
				const freshData = (await freshRes.json()) as { data?: ImportTemplate[] };
				dispatch({ type: "TEMPLATE_SAVED", templates: freshData.data ?? [] });
			}
		} catch {
			dispatch({ type: "SET_LOADING", loading: false });
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [state.newTemplateName, state.importType, state.headerRow, state.columnMap]);

	const handleConfirm = useCallback(async () => {
		if (state.preview?.type === "goleadores" && state.preview.playerResolutions) {
			const unresolved = state.preview.playerResolutions.filter(
				(p: PlayerResolution) =>
					!p.found && p.candidates.length > 0 && !state.resolutions[p.rawName],
			);
			if (unresolved.length > 0) {
				dispatch({
					type: "SET_ERROR",
					error: `Selecciona el jugador correcto para: ${unresolved.map((p: PlayerResolution) => p.rawName).join(", ")}`,
				});
				return;
			}
		}
		dispatch({ type: "SET_LOADING", loading: true });
		try {
			const fd = new FormData();
			fd.append("file", state.file!);
			fd.append("league_id", state.leagueId.trim());
			fd.append("action", "confirm");
			fd.append(
				"mapping",
				JSON.stringify({
					type: state.importType,
					sheetName: state.activeSheet,
					headerRow: state.headerRow,
					columnMap: state.columnMap,
					jornada: state.jornada ? parseInt(state.jornada) : undefined,
				}),
			);
			if (state.preview?.type === "goleadores") {
				fd.append("resolutions", JSON.stringify(state.resolutions));
			}
			if (state.excludedRows.size > 0) {
				fd.append("exclude_rows", JSON.stringify([...state.excludedRows]));
			}
			const res = await fetch("/api/import/bulk", { method: "POST", body: fd });
			const data = (await res.json()) as { ok: boolean; error?: string; data?: ImportResult };
			if (!data.ok || !data.data) {
				dispatch({ type: "SET_ERROR", error: data.error ?? "Error desconocido" });
				return;
			}
			dispatch({ type: "CONFIRM_SUCCESS", result: data.data });
		} finally {
			dispatch({ type: "SET_LOADING", loading: false });
		}
	}, [
		state.file,
		state.preview,
		state.resolutions,
		state.leagueId,
		state.importType,
		state.activeSheet,
		state.headerRow,
		state.columnMap,
		state.jornada,
		state.excludedRows,
	]);

	return {
		state,
		derived: buildDerived(state),
		handlers: {
			setLeagueId,
			setImportType,
			setJornada,
			setFile,
			setColumnMap,
			setNewTemplateName,
			applyTemplate,
			setHeaderRow,
			setResolution,
			toggleExcludedRow,
			clearExcludedRows,
			setCopiedIdx,
			navigate,
			handleDetect,
			handleSheetChange,
			handlePreview,
			handleSaveTemplate,
			handleConfirm,
			reset,
		},
	};
}
