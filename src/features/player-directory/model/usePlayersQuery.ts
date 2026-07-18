"use client";

/**
 * features/player-directory/model/usePlayersQuery.ts
 *
 * Query gateada del directorio público de jugadores (§7.3b). Recibe el
 * filtro ya resuelto de `usePlayersFilters`, arma la key desde la fábrica
 * central `queryKeys.players` y devuelve ViewModels mapeados — nunca el DTO
 * crudo (§19).
 */

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/shared/api/client";
import { queryKeys } from "@/shared/api/query-keys";
import type { PlayerListItem } from "@/entities/player";
import { mapPlayerListItemToDirectoryView } from "../lib/map-player-directory-view";
import { PLAYERS_SEARCH_URL } from "../constants";

export function usePlayersQuery(city: string, debouncedQuery: string) {
	return useQuery({
		queryKey: queryKeys.players.list({ city, q: debouncedQuery }),
		queryFn: async () => {
			const res = await apiFetch<PlayerListItem[]>(PLAYERS_SEARCH_URL(city, debouncedQuery));
			if (!res.ok) throw new Error(res.error);
			return res.data.map(mapPlayerListItemToDirectoryView);
		},
	});
}
