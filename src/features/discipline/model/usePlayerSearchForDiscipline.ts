"use client";

/**
 * features/discipline/model/usePlayerSearchForDiscipline.ts
 * Búsqueda de jugador por nombre org/owner-wide — paso 1 de "Registrar
 * sanción" en modo global (B7b). Mismo criterio que
 * team-management/model/useOrgPlayerSearch.ts: la key incluye el término ya
 * debounced (cada término se cachea, no se refetch al reabrir), habilitado
 * solo con 2+ letras.
 */

import { useQuery } from "@tanstack/react-query";
import type { DisciplinePlayerSearchResult } from "@/entities/suspension";
import { apiFetch } from "@/shared/api/client";
import { queryKeys } from "@/shared/api/query-keys";
import { DISCIPLINE_PLAYER_SEARCH_URL } from "../constants";

export function usePlayerSearchForDiscipline(q: string) {
	const query = q.trim();
	return useQuery<DisciplinePlayerSearchResult[]>({
		queryKey: queryKeys.players.searchDiscipline(query),
		enabled: query.length >= 2,
		staleTime: 30_000,
		queryFn: async () => {
			const res = await apiFetch<DisciplinePlayerSearchResult[]>(
				DISCIPLINE_PLAYER_SEARCH_URL(query),
			);
			if (!res.ok) throw new Error(res.error);
			return res.data;
		},
	});
}
