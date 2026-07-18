"use client";

/**
 * features/tournament-skin/model/useActivationMutations.ts
 *
 * Mutaciones del panel de temas. Toda mutación invalida vía el registro
 * central (`shared/api/cache-invalidation.ts`, §4 del estándar de caché):
 * encender o apagar una activación puede cambiar el skin público al instante.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { SkinActivationDto } from "@/entities/skin-activation";
import { apiFetch } from "@/shared/api/client";
import { invalidate } from "@/shared/api/cache-invalidation";
import { SKIN_ACTIVATIONS_URL } from "../constants";
import type { ActivationFormInput } from "./activation-form-schema";

export function useCreateSkinActivation() {
	const queryClient = useQueryClient();
	return useMutation<SkinActivationDto, Error, ActivationFormInput>({
		mutationFn: async (input) => {
			const res = await apiFetch<SkinActivationDto>(SKIN_ACTIVATIONS_URL, {
				method: "POST",
				body: input,
			});
			if (!res.ok) throw new Error(res.error);
			return res.data;
		},
		onSuccess: () => invalidate.skinChanged(queryClient),
	});
}

export function useToggleSkinActivation() {
	const queryClient = useQueryClient();
	return useMutation<SkinActivationDto, Error, { id: string; isEnabled: boolean }>({
		mutationFn: async ({ id, isEnabled }) => {
			const res = await apiFetch<SkinActivationDto>(`${SKIN_ACTIVATIONS_URL}/${id}`, {
				method: "PATCH",
				body: { isEnabled },
			});
			if (!res.ok) throw new Error(res.error);
			return res.data;
		},
		onSuccess: () => invalidate.skinChanged(queryClient),
	});
}

export function useDeleteSkinActivation() {
	const queryClient = useQueryClient();
	return useMutation<void, Error, { id: string }>({
		mutationFn: async ({ id }) => {
			const res = await apiFetch<null>(`${SKIN_ACTIVATIONS_URL}/${id}`, { method: "DELETE" });
			if (!res.ok) throw new Error(res.error);
		},
		onSuccess: () => invalidate.skinChanged(queryClient),
	});
}
