"use client";

/**
 * features/team-management/model/useTransferModal.ts
 * Carga los equipos disponibles como destino de transferencia.
 */

import { useState, useCallback } from "react";
import { TEAMS_BY_LEAGUE_URL } from "../constants";
import type { TeamOption, TransferFormData } from "../types";

export type UseTransferModalReturn = {
	availableTeams: TeamOption[];
	loadingTeams: boolean;
	targetTeamId: string;
	hasExitLetter: boolean;
	setTargetTeamId: (id: string) => void;
	setHasExitLetter: (v: boolean) => void;
	loadTeams: (leagueId: string, excludeTeamId: string) => Promise<void>;
	getFormData: () => TransferFormData;
};

export function useTransferModal(): UseTransferModalReturn {
	const [availableTeams, setAvailableTeams] = useState<TeamOption[]>([]);
	const [loadingTeams, setLoadingTeams] = useState(false);
	const [targetTeamId, setTargetTeamId] = useState("");
	const [hasExitLetter, setHasExitLetter] = useState(false);

	const loadTeams = useCallback(async (leagueId: string, excludeTeamId: string) => {
		setLoadingTeams(true);
		setTargetTeamId("");
		try {
			const res = await fetch(TEAMS_BY_LEAGUE_URL(leagueId));
			const data = (await res.json()) as { ok: boolean; data?: TeamOption[] };
			if (data.ok && data.data) {
				setAvailableTeams(data.data.filter((t) => t.id !== excludeTeamId));
			}
		} finally {
			setLoadingTeams(false);
		}
	}, []);

	const getFormData = useCallback(
		(): TransferFormData => ({ targetTeamId, hasExitLetter }),
		[targetTeamId, hasExitLetter],
	);

	return {
		availableTeams,
		loadingTeams,
		targetTeamId,
		hasExitLetter,
		setTargetTeamId,
		setHasExitLetter,
		loadTeams,
		getFormData,
	};
}
