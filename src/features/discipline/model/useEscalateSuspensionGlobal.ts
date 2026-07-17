"use client";

/**
 * features/discipline/model/useEscalateSuspensionGlobal.ts
 * Variante de useEscalateSuspension para la vista global (B7b): invalida la
 * query global y también la del tab de la liga dueña de la suspensión (la
 * trae `variables`), sin necesitar un leagueId fijo por hook.
 * Feedback obligatorio (§7.2b AGENTS.md): notify.success/error.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { EscalateSuspensionInput, SuspensionDto } from "@/entities/suspension";
import { apiFetch } from "@/shared/api/client";
import { invalidate } from "@/shared/api/cache-invalidation";
import { notify } from "@/shared/lib/notify";
import { SUSPENSION_URL } from "../constants";

type Variables = { suspensionId: string; leagueId: string; input: EscalateSuspensionInput };

export function useEscalateSuspensionGlobal() {
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
			invalidate.suspensionChangedGlobal(queryClient, { leagueId: variables.leagueId });
			notify.success(variables.input.action === "lift" ? "Sanción levantada" : "Sanción escalada");
		},
		onError: (error) => {
			notify.error(error.message || "No se pudo actualizar la sanción");
		},
	});
}
