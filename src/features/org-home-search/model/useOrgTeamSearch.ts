"use client";

/**
 * features/org-home-search/model/useOrgTeamSearch.ts
 * Búsqueda de equipos por nombre, scoped a una org (por slug). Mismo patrón
 * que team-management/useOrgPlayerSearch y discipline/usePlayerSearchForDiscipline:
 * la key incluye el término ya debounced (cada término se cachea).
 */

import { useQuery } from "@tanstack/react-query";
import type { OrgTeamSearchResult } from "@/entities/organization";
import { apiFetch } from "@/shared/api/client";
import { queryKeys } from "@/shared/api/query-keys";
import { ORG_TEAM_SEARCH_URL, SEARCH_MIN_CHARS } from "../constants";

export function useOrgTeamSearch(orgSlug: string, query: string) {
	const q = query.trim();
	return useQuery<OrgTeamSearchResult[]>({
		queryKey: queryKeys.organizations.teamSearch(orgSlug, q),
		enabled: q.length >= SEARCH_MIN_CHARS,
		staleTime: 30_000,
		queryFn: async () => {
			const res = await apiFetch<OrgTeamSearchResult[]>(ORG_TEAM_SEARCH_URL(orgSlug, q));
			if (!res.ok) throw new Error(res.error);
			return res.data;
		},
	});
}
