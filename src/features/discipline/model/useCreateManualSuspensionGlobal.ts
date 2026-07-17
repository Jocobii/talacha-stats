"use client";

/**
 * features/discipline/model/useCreateManualSuspensionGlobal.ts
 * Variante de useCreateManualSuspension para la vista global (B7b): el
 * leagueId viene por variable de la mutación (el usuario lo elige en el
 * modal), no fijo por hook. Invalida tanto la vista global como la del tab
 * de esa liga, para que ambas queden consistentes.
 * Feedback obligatorio (§7.2b AGENTS.md): notify.success/error.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateManualSuspensionInput, SuspensionDto } from "@/entities/suspension";
import { apiFetch } from "@/shared/api/client";
import { invalidate } from "@/shared/api/cache-invalidation";
import { notify } from "@/shared/lib/notify";
import { LEAGUE_SUSPENSIONS_URL } from "../constants";

type Variables = { leagueId: string; input: CreateManualSuspensionInput };

export function useCreateManualSuspensionGlobal() {
	const queryClient = useQueryClient();

	return useMutation<SuspensionDto, Error, Variables>({
		mutationFn: async ({ leagueId, input }) => {
			const res = await apiFetch<SuspensionDto>(LEAGUE_SUSPENSIONS_URL(leagueId), {
				method: "POST",
				body: input,
			});
			if (!res.ok) throw new Error(res.error);
			return res.data;
		},
		onSuccess: (_data, variables) => {
			invalidate.suspensionChangedGlobal(queryClient, { leagueId: variables.leagueId });
			notify.success("Sanción registrada");
		},
		onError: (error) => {
			notify.error(error.message || "No se pudo registrar la sanción");
		},
	});
}
