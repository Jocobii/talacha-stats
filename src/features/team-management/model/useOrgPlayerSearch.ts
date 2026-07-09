"use client";

/**
 * features/team-management/model/useOrgPlayerSearch.ts
 *
 * Búsqueda por nombre de jugadores existentes de la organización (scope liga).
 * Estado-de-servidor vía TanStack Query (§7.2): la key incluye el término ya
 * debounced, así que cada término se cachea y no se refetch al reabrir.
 */

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/shared/api/client";
import { ORG_PLAYER_SEARCH_URL } from "../constants";
import type { OrgPlayerSearchResult } from "../types";

export function useOrgPlayerSearch(leagueId: string, query: string) {
	const q = query.trim();
	return useQuery({
		queryKey: ["org-player-search", leagueId, q] as const,
		enabled: q.length >= 2,
		staleTime: 30_000,
		queryFn: async (): Promise<OrgPlayerSearchResult[]> => {
			const res = await apiFetch<OrgPlayerSearchResult[]>(ORG_PLAYER_SEARCH_URL(leagueId, q));
			if (!res.ok) throw new Error(res.error);
			return res.data;
		},
	});
}
