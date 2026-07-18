"use client";

/**
 * features/discipline/model/useSuspensions.ts
 * Lee suspensiones + roster de una liga (B7). SSR→props: la página baja
 * `initialData` con el mismo shape para el primer render sin loading.
 */

import { useQuery } from "@tanstack/react-query";
import type { SuspensionListItemDto, SuspensionRosterPlayer } from "@/entities/suspension";
import { apiFetch } from "@/shared/api/client";
import { queryKeys } from "@/shared/api/query-keys";
import { LEAGUE_SUSPENSIONS_URL } from "../constants";

export type SuspensionsData = {
	suspensions: SuspensionListItemDto[];
	roster: SuspensionRosterPlayer[];
};

export function useSuspensions(leagueId: string, initialData: SuspensionsData) {
	return useQuery<SuspensionsData>({
		queryKey: queryKeys.suspensions.byLeague(leagueId),
		queryFn: async () => {
			const res = await apiFetch<SuspensionsData>(LEAGUE_SUSPENSIONS_URL(leagueId));
			if (!res.ok) throw new Error(res.error);
			return res.data;
		},
		initialData,
	});
}
