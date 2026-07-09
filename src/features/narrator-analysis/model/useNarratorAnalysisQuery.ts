"use client";

/**
 * features/narrator-analysis/model/useNarratorAnalysisQuery.ts
 *
 * Lectura (TanStack Query) del análisis pre-partido (flujo BD, `/api/narrator`).
 * Solo se dispara cuando hay un `ConfirmedMatchup` (liga + dos equipos ya
 * validados) — ver `useNarratorMatchup`, dueño de esa confirmación.
 */

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/shared/api/client";
import { queryKeys } from "@/shared/api/query-keys";
import type { NarratorAnalysis } from "@/entities/narrator/model";
import { NARRATOR_ANALYSIS_URL } from "../constants";
import type { ConfirmedMatchup } from "../types";

export function useNarratorAnalysisQuery(matchup: ConfirmedMatchup | null) {
	return useQuery({
		queryKey: queryKeys.narratorAnalysis(
			matchup?.leagueId ?? "",
			matchup?.teamA ?? "",
			matchup?.teamB ?? "",
		),
		enabled: matchup !== null,
		queryFn: async (): Promise<NarratorAnalysis> => {
			// `enabled` garantiza que `matchup` no es null cuando queryFn corre.
			const { leagueId, teamA, teamB } = matchup as ConfirmedMatchup;
			const result = await apiFetch<NarratorAnalysis>(
				NARRATOR_ANALYSIS_URL(leagueId, teamA, teamB),
			);
			if (!result.ok) throw new Error(result.error);
			return result.data;
		},
	});
}
