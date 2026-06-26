"use client";

/**
 * features/team-management/model/useLeagueTeams.ts
 *
 * Lectura (TanStack Query) de los equipos de una liga para el selector de
 * transferencia. `queryFn` usa `apiFetch` (transporte) y mapea el DTO crudo a
 * `TeamOption` con el mapper (§19) — la UI nunca ve la fila cruda de DB.
 *
 * El filtro de exclusión se aplica con `select` para que la caché se comparta
 * entre distintos `excludeTeamId` (misma liga = misma query key).
 */

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/shared/api/client";
import type { Team } from "@/entities/team";
import { TEAMS_BY_LEAGUE_URL } from "../constants";
import { mapTeamToTeamOption } from "../lib/map-team-option";
import type { TeamOption } from "../types";

export const leagueTeamsQueryKey = (leagueId: string) => ["league-teams", leagueId] as const;

export function useLeagueTeams(leagueId: string, excludeTeamId?: string) {
	return useQuery({
		queryKey: leagueTeamsQueryKey(leagueId),
		enabled: leagueId.length > 0,
		queryFn: async (): Promise<TeamOption[]> => {
			const result = await apiFetch<Team[]>(TEAMS_BY_LEAGUE_URL(leagueId));
			if (!result.ok) throw new Error(result.error);
			return result.data.map(mapTeamToTeamOption);
		},
		select: (teams: TeamOption[]) =>
			excludeTeamId ? teams.filter((team) => team.id !== excludeTeamId) : teams,
	});
}
