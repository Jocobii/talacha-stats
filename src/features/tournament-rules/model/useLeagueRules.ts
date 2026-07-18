"use client";

/**
 * features/tournament-rules/model/useLeagueRules.ts
 *
 * Lectura del reglamento de una liga. El Server Component baja la config
 * como `initialData` (mapeada), así que pinta sin parpadeo — igual que
 * useTeamRosterQuery (§7.3, patrón SSR→props).
 */

import { useQuery } from "@tanstack/react-query";
import type { LeagueConfigDto } from "@/entities/league-config";
import { apiFetch } from "@/shared/api/client";
import { queryKeys } from "@/shared/api/query-keys";
import { LEAGUE_CONFIG_URL } from "../constants";
import { mapLeagueConfigToRulesView } from "../lib/map-rules-view";
import type { RulesFormView } from "../types";

export function useLeagueRules(leagueId: string, initialView: RulesFormView) {
	return useQuery<RulesFormView>({
		queryKey: queryKeys.leagues.config(leagueId),
		initialData: initialView,
		queryFn: async () => {
			const res = await apiFetch<LeagueConfigDto>(LEAGUE_CONFIG_URL(leagueId));
			if (!res.ok) throw new Error(res.error);
			return mapLeagueConfigToRulesView(res.data);
		},
	});
}
