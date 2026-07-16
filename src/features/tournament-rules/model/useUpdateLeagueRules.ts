"use client";

/**
 * features/tournament-rules/model/useUpdateLeagueRules.ts
 * Guarda el reglamento. Invalida leagueConfig — standings también depende de
 * `tiebreakers`, pero se recalcula en el próximo GET (no cachea fila propia).
 * Feedback obligatorio (§7.2b AGENTS.md): notify.success/error en toda mutación.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { LeagueConfigDto, UpdateLeagueConfigInput } from "@/entities/league-config";
import { apiFetch } from "@/shared/api/client";
import { queryKeys } from "@/shared/api/query-keys";
import { notify } from "@/shared/lib/notify";
import { LEAGUE_CONFIG_URL } from "../constants";
import { mapLeagueConfigToRulesView } from "../lib/map-rules-view";
import type { RulesFormView } from "../types";

export function useUpdateLeagueRules(leagueId: string) {
	const queryClient = useQueryClient();

	return useMutation<RulesFormView, Error, UpdateLeagueConfigInput>({
		mutationFn: async (input) => {
			const res = await apiFetch<LeagueConfigDto>(LEAGUE_CONFIG_URL(leagueId), {
				method: "PATCH",
				body: input,
			});
			if (!res.ok) throw new Error(res.error);
			return mapLeagueConfigToRulesView(res.data);
		},
		onSuccess: (view) => {
			queryClient.setQueryData(queryKeys.leagueConfig(leagueId), view);
			notify.success("Reglamento guardado");
		},
		onError: (error) => {
			notify.error(error.message || "No se pudo guardar el reglamento");
		},
	});
}
