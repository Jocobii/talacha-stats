"use client";

/**
 * features/discipline/model/useCreateManualSuspension.ts
 * Panel "Registrar sanción" (modo alta desde cero). Feedback obligatorio
 * (§7.2b AGENTS.md): notify.success/error en toda mutación.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateManualSuspensionInput, SuspensionDto } from "@/entities/suspension";
import { apiFetch } from "@/shared/api/client";
import { queryKeys } from "@/shared/api/query-keys";
import { notify } from "@/shared/lib/notify";
import { LEAGUE_SUSPENSIONS_URL } from "../constants";

export function useCreateManualSuspension(leagueId: string) {
	const queryClient = useQueryClient();

	return useMutation<SuspensionDto, Error, CreateManualSuspensionInput>({
		mutationFn: async (input) => {
			const res = await apiFetch<SuspensionDto>(LEAGUE_SUSPENSIONS_URL(leagueId), {
				method: "POST",
				body: input,
			});
			if (!res.ok) throw new Error(res.error);
			return res.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.suspensions(leagueId) });
			notify.success("Sanción registrada");
		},
		onError: (error) => {
			notify.error(error.message || "No se pudo registrar la sanción");
		},
	});
}
