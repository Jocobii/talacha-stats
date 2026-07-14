"use client";

/**
 * features/discipline/model/useLeagueRosterForDiscipline.ts
 * Roster de UNA liga, cargado bajo demanda cuando el usuario elige la liga
 * en el selector del alta manual global (B7b) — reusa el mismo endpoint que
 * la pantalla por liga (GET .../suspensions ya trae `roster`), sin duplicar
 * una ruta solo para esto.
 */

import { useQuery } from "@tanstack/react-query";
import type { SuspensionRosterPlayer } from "@/entities/suspension";
import { apiFetch } from "@/shared/api/client";
import { LEAGUE_SUSPENSIONS_URL } from "../constants";

export function useLeagueRosterForDiscipline(leagueId: string | null) {
	return useQuery<SuspensionRosterPlayer[]>({
		queryKey: ["league-roster-for-discipline", leagueId],
		queryFn: async () => {
			const res = await apiFetch<{ roster: SuspensionRosterPlayer[] }>(
				LEAGUE_SUSPENSIONS_URL(leagueId!),
			);
			if (!res.ok) throw new Error(res.error);
			return res.data.roster;
		},
		enabled: leagueId !== null,
	});
}
