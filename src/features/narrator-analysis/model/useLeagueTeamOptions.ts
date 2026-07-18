"use client";

/**
 * features/narrator-analysis/model/useLeagueTeamOptions.ts
 *
 * Lectura (TanStack Query) de los equipos de una liga para los <select> del
 * matchup pre-partido. `queryFn` usa `apiFetch` (transporte) y mapea el DTO
 * crudo a `TeamOption` con el mapper (§19) — la UI nunca ve la fila cruda.
 *
 * Deliberadamente independiente de `features/team-management/useLeagueTeams`:
 * las features no pueden importarse entre sí (§3.1). Comparten el mismo
 * endpoint pero cada una define su propia query key y su propio ViewModel.
 */

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/shared/api/client";
import { queryKeys } from "@/shared/api/query-keys";
import type { Team } from "@/entities/team";
import { NARRATOR_TEAMS_URL } from "../constants";
import { mapTeamToTeamOption } from "../lib/map-team-option";
import type { TeamOption } from "../types";

export function useLeagueTeamOptions(leagueId: string) {
	return useQuery({
		queryKey: queryKeys.narrator.teams(leagueId),
		enabled: leagueId.length > 0,
		queryFn: async (): Promise<TeamOption[]> => {
			const result = await apiFetch<Team[]>(NARRATOR_TEAMS_URL(leagueId));
			if (!result.ok) throw new Error(result.error);
			return result.data.map(mapTeamToTeamOption);
		},
	});
}
