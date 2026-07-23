"use client";

/**
 * features/global-search/model/useUniversalSearch.ts
 * Búsqueda universal por organización — mismo patrón que
 * org-home-search/useOrgTeamSearch (key incluye el término ya debounced).
 */

import { useQuery } from "@tanstack/react-query";
import type { SearchHit, SearchHitKind } from "@/entities/search";
import { apiFetch } from "@/shared/api/client";
import { queryKeys } from "@/shared/api/query-keys";
import { GLOBAL_SEARCH_URL, SEARCH_MIN_CHARS } from "../constants";

export function useUniversalSearch(orgSlug: string, query: string, types?: SearchHitKind[]) {
	const q = query.trim();
	return useQuery<SearchHit[]>({
		queryKey: queryKeys.search.universal(orgSlug, q, types),
		enabled: q.length >= SEARCH_MIN_CHARS,
		staleTime: 30_000,
		queryFn: async () => {
			const res = await apiFetch<SearchHit[]>(GLOBAL_SEARCH_URL(orgSlug, q));
			if (!res.ok) throw new Error(res.error);
			return res.data;
		},
	});
}
