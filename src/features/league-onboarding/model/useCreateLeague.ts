"use client";

/**
 * features/league-onboarding/model/useCreateLeague.ts
 *
 * Mutación de alta rápida de liga (TanStack Query). Estandariza el manejo de
 * loading/error/optimistic para mutaciones; apiFetch sigue siendo el transporte.
 */

import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/shared/api/client";
import type { QuickCreateLeagueInput } from "./league-form-schema";

export type CreatedLeague = { id: string; name: string; slug: string | null };
type CreateLeagueResponse = { league: CreatedLeague; teams: { id: string; name: string }[] };

export function useCreateLeague() {
	return useMutation<CreateLeagueResponse, Error, QuickCreateLeagueInput>({
		mutationFn: async (input) => {
			const res = await apiFetch<CreateLeagueResponse>("/api/leagues/quick-create", {
				method: "POST",
				body: input,
			});
			if (!res.ok) throw new Error(res.error);
			return res.data;
		},
	});
}
