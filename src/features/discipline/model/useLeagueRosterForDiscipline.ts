"use client";

/**
 * features/discipline/model/useLeagueRosterForDiscipline.ts
 * Roster de UNA liga con búsqueda por nombre server-side (primeros 10, o los
 * que matcheen `q`) — picker "autocomplete" del jugador en "Registrar
 * sanción" (B7/B7b), cargado bajo demanda al elegir liga / escribir. Reusa
 * el mismo endpoint que la pantalla por liga (GET .../suspensions ya trae
 * `roster`), sin duplicar una ruta solo para esto.
 */

import { useQuery } from "@tanstack/react-query";
import type { SuspensionRosterPlayer } from "@/entities/suspension";
import { apiFetch } from "@/shared/api/client";
import { queryKeys } from "@/shared/api/query-keys";
import { LEAGUE_ROSTER_SEARCH_URL } from "../constants";

export function useLeagueRosterForDiscipline(leagueId: string | null, q: string) {
	return useQuery<SuspensionRosterPlayer[]>({
		queryKey: queryKeys.suspensions.rosterSearch(leagueId, q),
		queryFn: async () => {
			const res = await apiFetch<{ roster: SuspensionRosterPlayer[] }>(
				LEAGUE_ROSTER_SEARCH_URL(leagueId!, q),
			);
			if (!res.ok) throw new Error(res.error);
			return res.data.roster;
		},
		enabled: leagueId !== null,
	});
}
