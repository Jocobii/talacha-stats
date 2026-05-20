"use client";

/**
 * features/league-onboarding/model/useStepTeams.ts
 * Estado y lógica del paso 0 — creación de equipos en bloque.
 */

import { useState, useRef } from "react";
import type { RefObject } from "react";
import { TEAM_COLORS, BULK_TEAMS_URL } from "../constants";
import type { DraftTeam, CreatedTeam, League } from "../types";

export type UseStepTeamsReturn = {
	draft: string;
	drafts: DraftTeam[];
	saving: boolean;
	error: string;
	inputRef: RefObject<HTMLInputElement | null>;
	setDraftInput: (v: string) => void;
	addDraft: () => void;
	removeDraft: (index: number) => void;
	handleNext: () => Promise<void>;
};

export function useStepTeams(
	league: League,
	onNext: (teams: CreatedTeam[]) => void,
): UseStepTeamsReturn {
	const [draft, setDraft] = useState("");
	const [drafts, setDrafts] = useState<DraftTeam[]>([]);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");
	const inputRef = useRef<HTMLInputElement | null>(null);

	function setDraftInput(v: string): void {
		setDraft(v);
		setError("");
	}

	function addDraft(): void {
		const name = draft.trim();
		if (!name) return;
		const isDuplicate = drafts.some((d) => d.name.toLowerCase() === name.toLowerCase());
		if (isDuplicate) {
			setError("Ya tienes un equipo con ese nombre.");
			return;
		}
		const color = TEAM_COLORS[drafts.length % TEAM_COLORS.length] ?? TEAM_COLORS[0];
		setDrafts((prev) => [...prev, { name, color }]);
		setDraft("");
		setError("");
		inputRef.current?.focus();
	}

	function removeDraft(index: number): void {
		setDrafts((prev) => prev.filter((_, j) => j !== index));
	}

	async function handleNext(): Promise<void> {
		if (drafts.length === 0) return;
		setSaving(true);
		setError("");
		try {
			const res = await fetch(BULK_TEAMS_URL(league.id), {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ teams: drafts.map((d) => ({ name: d.name, color: d.color })) }),
			});
			const data = (await res.json()) as { ok: boolean; data?: CreatedTeam[]; error?: string };
			if (!data.ok) {
				setError(data.error ?? "Error al guardar equipos.");
				return;
			}
			onNext(data.data ?? []);
		} catch {
			setError("Error de conexión. Intenta de nuevo.");
		} finally {
			setSaving(false);
		}
	}

	return {
		draft,
		drafts,
		saving,
		error,
		inputRef,
		setDraftInput,
		addDraft,
		removeDraft,
		handleNext,
	};
}
