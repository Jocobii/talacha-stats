"use client";

/**
 * features/onboarding-wizard/model/useCreateLeagueStep.ts
 * Mutación de alta rápida de liga (paso Operación). Reusa el endpoint
 * /api/leagues/quick-create ya existente (features/league-onboarding). En
 * !ok propaga el error del server tal cual (incluye LEAGUE_EXISTS, §7.2).
 */

import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/shared/api/client";
import { QUICK_CREATE_LEAGUE_URL } from "../constants";
import { mapLeagueToSummary } from "../lib/map-league-to-summary";
import type { CreatedLeagueView } from "../types";
import type { OnboardingLeagueInput } from "./onboarding-league-schema";

type QuickCreateLeagueResponse = {
	league: { id: string; name: string; slug: string | null; season: string; dayOfWeek: string };
};

export function useCreateLeagueStep() {
	return useMutation<CreatedLeagueView, Error, OnboardingLeagueInput>({
		mutationFn: async (input) => {
			const res = await apiFetch<QuickCreateLeagueResponse>(QUICK_CREATE_LEAGUE_URL, {
				method: "POST",
				body: input,
			});
			if (!res.ok) throw new Error(res.error);
			return mapLeagueToSummary(res.data.league);
		},
	});
}
