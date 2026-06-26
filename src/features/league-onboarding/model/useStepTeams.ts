"use client";

/**
 * features/league-onboarding/model/useStepTeams.ts
 * Estado y lógica del paso de equipos del wizard — creación en bloque.
 *
 * Los nombres se capturan con TeamChipsInput (campo de fichas perdonador) y se
 * guardan en bloque al avanzar. La dedup por nombre la maneja TeamChipsInput en
 * el cliente y el constraint UNIQUE(league_id, name_canonical) en el server.
 */

import { useState } from "react";
import { TEAM_COLORS, BULK_TEAMS_URL } from "../constants";
import { apiFetch } from "@/shared/api/client";
import type { CreatedTeam, League } from "../types";

export type UseStepTeamsReturn = {
	names: string[];
	saving: boolean;
	error: string;
	setNames: (names: string[]) => void;
	handleNext: () => Promise<void>;
};

export function useStepTeams(
	league: League,
	onNext: (teams: CreatedTeam[]) => void,
): UseStepTeamsReturn {
	const [names, setNames] = useState<string[]>([]);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");

	async function handleNext(): Promise<void> {
		if (names.length === 0) return;
		setSaving(true);
		setError("");
		try {
			const payload = names.map((name, i) => ({
				name,
				color: TEAM_COLORS[i % TEAM_COLORS.length] ?? TEAM_COLORS[0],
			}));
			const res = await apiFetch<CreatedTeam[]>(BULK_TEAMS_URL(league.id), {
				method: "POST",
				body: { teams: payload },
			});
			if (!res.ok) {
				setError(res.error);
				return;
			}
			onNext(res.data ?? []);
		} catch {
			setError("Error de conexión. Intenta de nuevo.");
		} finally {
			setSaving(false);
		}
	}

	return { names, saving, error, setNames, handleNext };
}
