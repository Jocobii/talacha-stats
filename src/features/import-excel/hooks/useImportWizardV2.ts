"use client";

import { useState, useCallback, useEffect } from "react";
import type {
	ImportPreviewResult,
	MatchOutcome,
	ImportDecision,
	ParsedRow,
	ConfirmImportResult,
} from "../types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type WizardStep =
	| "upload"
	| "sheet" // solo aparece cuando el Excel tiene > 1 hoja
	| "preview"
	| "doubts"
	| "suggestions"
	| "confirm"
	| "result";

interface WizardState {
	step: WizardStep;
	leagueId: string;
	jornada: string;
	file: File | null;
	/** Nombres de todos los tabs/hojas del Excel subido. */
	sheets: string[];
	/** Tab seleccionado por el usuario (o auto-seleccionado por jornada). */
	selectedSheet: string;
	/** Primeras filas del sheet seleccionado — para mostrar en el paso "sheet". */
	excelPreview: string[][];
	preview: ImportPreviewResult | null;
	/** Decisions keyed by row fingerprint (= rowId). */
	decisions: Record<string, ImportDecision>;
	result: ConfirmImportResult | null;
	loading: boolean;
	error: string;
}

const INITIAL: WizardState = {
	step: "upload",
	leagueId: "",
	jornada: "1",
	file: null,
	sheets: [],
	selectedSheet: "",
	excelPreview: [],
	preview: null,
	decisions: {},
	result: null,
	loading: false,
	error: "",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildAutoDecisions(preview: ImportPreviewResult): Record<string, ImportDecision> {
	const decisions: Record<string, ImportDecision> = {};
	for (const outcome of preview.outcomes) {
		const rowId = outcome.row.fingerprint;
		if (outcome.kind === "auto_resolved") {
			decisions[rowId] = { kind: "link_profile", rowId, profileId: outcome.profileId };
		} else if (outcome.kind === "create_new") {
			decisions[rowId] = { kind: "create_new", rowId, fullName: outcome.row.rawFullName };
		} else if (outcome.kind === "cross_org_suggestion") {
			decisions[rowId] = { kind: "create_new", rowId, fullName: outcome.row.rawFullName };
		}
		// intra_org_doubt → no default; user must pick
	}
	return decisions;
}

function nextStepAfterPreview(preview: ImportPreviewResult): WizardStep {
	if (preview.outcomes.some((o) => o.kind === "intra_org_doubt")) return "doubts";
	if (preview.outcomes.some((o) => o.kind === "cross_org_suggestion")) return "suggestions";
	return "confirm";
}

function nextStepAfterDoubts(preview: ImportPreviewResult): WizardStep {
	if (preview.outcomes.some((o) => o.kind === "cross_org_suggestion")) return "suggestions";
	return "confirm";
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useImportWizardV2() {
	const [state, setState] = useState<WizardState>(INITIAL);

	// Warn before page unload while a session is in progress
	useEffect(() => {
		const inProgress = state.step !== "upload" && state.step !== "result";
		if (!inProgress) return;
		const handler = (e: BeforeUnloadEvent) => {
			e.preventDefault();
		};
		window.addEventListener("beforeunload", handler);
		return () => window.removeEventListener("beforeunload", handler);
	}, [state.step]);

	// ── Derived ─────────────────────────────────────────────────────────────

	const outcomes = state.preview?.outcomes ?? [];

	const doubts = outcomes.filter(
		(o): o is Extract<MatchOutcome, { kind: "intra_org_doubt" }> => o.kind === "intra_org_doubt",
	);
	const suggestions = outcomes.filter(
		(o): o is Extract<MatchOutcome, { kind: "cross_org_suggestion" }> =>
			o.kind === "cross_org_suggestion",
	);
	const unresolvedDoubts = doubts.filter((d) => !state.decisions[d.row.fingerprint]);
	const allDoubtsDone = unresolvedDoubts.length === 0;

	// ── Handlers ────────────────────────────────────────────────────────────

	/**
	 * Botón "Continuar" del paso 1 (upload).
	 * Llama a /api/import/detect para obtener sheets + preview de filas.
	 * - Si el archivo tiene > 1 hoja → avanza al paso "sheet" para que el usuario elija.
	 * - Si solo tiene 1 hoja → llama directamente al preview (se salta el paso "sheet").
	 */
	const handleDetect = useCallback(async () => {
		if (!state.file || !state.leagueId) return;
		setState((prev) => ({ ...prev, loading: true, error: "" }));
		try {
			const fd = new FormData();
			fd.append("file", state.file);
			if (state.jornada) fd.append("jornada", state.jornada);

			const res = await fetch("/api/import/detect", { method: "POST", body: fd });
			const data = (await res.json()) as {
				ok: boolean;
				error?: string;
				data?: { sheets: string[]; activeSheet: string; preview: string[][] };
			};

			if (!data.ok || !data.data) {
				setState((prev) => ({
					...prev,
					loading: false,
					error: data.error ?? "No se pudo leer el archivo",
				}));
				return;
			}

			const { sheets, activeSheet, preview: excelPreview } = data.data;

			if (sheets.length > 1) {
				// Múltiples hojas → mostrar el selector
				setState((prev) => ({
					...prev,
					loading: false,
					sheets,
					selectedSheet: activeSheet,
					excelPreview,
					step: "sheet",
					error: "",
				}));
			} else {
				// Una sola hoja → saltar directo al preview de matching
				setState((prev) => ({
					...prev,
					sheets,
					selectedSheet: activeSheet,
					excelPreview,
				}));
				// Llamamos handlePreview con los valores actualizados directamente
				await callPreviewAPI(state.file, state.leagueId, state.jornada, activeSheet, setState);
			}
		} catch (e) {
			setState((prev) => ({
				...prev,
				loading: false,
				error: e instanceof Error ? e.message : "Error inesperado",
			}));
		}
	}, [state.file, state.leagueId, state.jornada]);

	/**
	 * Cuando el usuario cambia el tab en el paso "sheet", recarga las filas de preview
	 * para que pueda ver el contenido antes de confirmar.
	 */
	const handleSheetChange = useCallback(
		async (sheet: string) => {
			if (!state.file) return;
			setState((prev) => ({ ...prev, selectedSheet: sheet, loading: true }));
			try {
				const fd = new FormData();
				fd.append("file", state.file);
				fd.append("sheet", sheet);
				const res = await fetch("/api/import/detect", { method: "POST", body: fd });
				const data = (await res.json()) as {
					ok: boolean;
					data?: { preview: string[][] };
				};
				if (data.ok && data.data) {
					setState((prev) => ({
						...prev,
						excelPreview: data.data!.preview,
						loading: false,
					}));
				} else {
					setState((prev) => ({ ...prev, loading: false }));
				}
			} catch {
				setState((prev) => ({ ...prev, loading: false }));
			}
		},
		[state.file],
	);

	/**
	 * Botón "Continuar" del paso "sheet" — llama al motor de matching.
	 */
	const handlePreview = useCallback(async () => {
		if (!state.file || !state.leagueId) return;
		await callPreviewAPI(state.file, state.leagueId, state.jornada, state.selectedSheet, setState);
	}, [state.file, state.leagueId, state.jornada, state.selectedSheet]);

	const setDecision = useCallback((rowId: string, decision: ImportDecision) => {
		setState((prev) => ({
			...prev,
			decisions: { ...prev.decisions, [rowId]: decision },
		}));
	}, []);

	const goFromPreview = useCallback(() => {
		setState((prev) => {
			if (!prev.preview) return prev;
			return { ...prev, step: nextStepAfterPreview(prev.preview), error: "" };
		});
	}, []);

	const goFromDoubts = useCallback(() => {
		setState((prev) => {
			if (!prev.preview) return prev;
			return { ...prev, step: nextStepAfterDoubts(prev.preview), error: "" };
		});
	}, []);

	const navigate = useCallback((step: WizardStep) => {
		setState((prev) => ({ ...prev, step, error: "" }));
	}, []);

	const handleConfirm = useCallback(async () => {
		if (!state.preview || !state.leagueId) return;
		setState((prev) => ({ ...prev, loading: true, error: "" }));
		try {
			const rowsById: Record<string, ParsedRow> = {};
			for (const o of state.preview.outcomes) {
				rowsById[o.row.fingerprint] = o.row;
			}
			const decisions = Object.values(state.decisions);

			const body = {
				leagueId: state.leagueId,
				decisions,
				rowsById,
				jornada: state.jornada ? parseInt(state.jornada, 10) : undefined,
			};

			const res = await fetch("/api/imports/confirm", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body),
			});
			const json = (await res.json()) as {
				ok: boolean;
				data?: ConfirmImportResult;
				error?: string;
			};
			if (!json.ok || !json.data)
				throw new Error(json.error ?? "Error al confirmar la importación");

			setState((prev) => ({
				...prev,
				loading: false,
				result: json.data!,
				step: "result",
				error: "",
			}));
		} catch (e) {
			setState((prev) => ({
				...prev,
				loading: false,
				error: e instanceof Error ? e.message : "Error inesperado",
			}));
		}
	}, [state.preview, state.leagueId, state.jornada, state.decisions]);

	const reset = useCallback(() => setState(INITIAL), []);

	return {
		state,
		derived: {
			doubts,
			suggestions,
			unresolvedDoubts,
			allDoubtsDone,
			hasDoubts: doubts.length > 0,
			hasSuggestions: suggestions.length > 0,
		},
		handlers: {
			setLeagueId: (id: string) => setState((prev) => ({ ...prev, leagueId: id })),
			setJornada: (j: string) => setState((prev) => ({ ...prev, jornada: j })),
			setFile: (f: File | null) => setState((prev) => ({ ...prev, file: f })),
			handleDetect,
			handleSheetChange,
			handlePreview,
			setDecision,
			goFromPreview,
			goFromDoubts,
			navigate,
			handleConfirm,
			reset,
		},
	};
}

// ---------------------------------------------------------------------------
// Helper privado — extraído para poder llamarlo desde handleDetect sin
// depender del state actual (evita closure stale).
// ---------------------------------------------------------------------------

async function callPreviewAPI(
	file: File,
	leagueId: string,
	jornada: string,
	selectedSheet: string,
	setState: React.Dispatch<React.SetStateAction<WizardState>>,
) {
	setState((prev) => ({ ...prev, loading: true, error: "" }));
	try {
		const fd = new FormData();
		fd.append("file", file);
		fd.append("league_id", leagueId);
		if (jornada) fd.append("jornada", jornada);
		if (selectedSheet) fd.append("sheet", selectedSheet);

		const res = await fetch("/api/imports/preview", { method: "POST", body: fd });
		const json = (await res.json()) as {
			ok: boolean;
			data?: ImportPreviewResult;
			error?: string;
		};
		if (!json.ok || !json.data) throw new Error(json.error ?? "Error al procesar el archivo");

		const preview = json.data;
		const decisions = buildAutoDecisions(preview);

		setState((prev) => ({
			...prev,
			loading: false,
			preview,
			decisions,
			step: "preview",
			error: "",
		}));
	} catch (e) {
		setState((prev) => ({
			...prev,
			loading: false,
			error: e instanceof Error ? e.message : "Error inesperado",
		}));
	}
}
