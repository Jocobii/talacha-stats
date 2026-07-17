"use client";

/**
 * features/discipline/model/useEscalateSuspension.ts
 * Escalar (matches → time/permanent) o levantar (mismo endpoint PATCH,
 * discriminado por `action` en el body). Feedback obligatorio (§7.2b
 * AGENTS.md): notify.success/error en toda mutación.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { EscalateSuspensionInput, SuspensionDto } from "@/entities/suspension";
import { apiFetch } from "@/shared/api/client";
import { invalidate } from "@/shared/api/cache-invalidation";
import { notify } from "@/shared/lib/notify";
import { SUSPENSION_URL } from "../constants";

type Variables = { suspensionId: string; input: EscalateSuspensionInput };

export function useEscalateSuspension(leagueId: string) {
	const queryClient = useQueryClient();

	return useMutation<SuspensionDto, Error, Variables>({
		mutationFn: async ({ suspensionId, input }) => {
			const res = await apiFetch<SuspensionDto>(SUSPENSION_URL(suspensionId), {
				method: "PATCH",
				body: input,
			});
			if (!res.ok) throw new Error(res.error);
			return res.data;
		},
		onSuccess: (_data, variables) => {
			invalidate.suspensionChanged(queryClient, { leagueId });
			notify.success(variables.input.action === "lift" ? "Sanción levantada" : "Sanción escalada");
		},
		onError: (error) => {
			notify.error(error.message || "No se pudo actualizar la sanción");
		},
	});
}
