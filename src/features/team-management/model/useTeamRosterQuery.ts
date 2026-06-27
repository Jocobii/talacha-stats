"use client";

/**
 * features/team-management/model/useTeamRosterQuery.ts
 *
 * Lectura del roster (TanStack Query). El Server Component baja el roster como
 * `initialData`, así que pinta sin parpadeo; a partir de ahí la caché es la
 * fuente de verdad y se refresca por invalidación (no por `router.refresh()`).
 */

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/shared/api/client";
import { queryKeys } from "@/shared/api/query-keys";
import { TEAM_ROSTER_URL } from "../constants";
import type { RosterEntry } from "../types";

export function useTeamRosterQuery(teamId: string, initialRoster: RosterEntry[]) {
	return useQuery({
		queryKey: queryKeys.teamRoster(teamId),
		initialData: initialRoster,
		queryFn: async (): Promise<RosterEntry[]> => {
			const result = await apiFetch<RosterEntry[]>(TEAM_ROSTER_URL(teamId));
			if (!result.ok) throw new Error(result.error);
			return result.data;
		},
	});
}
