"use client";

/**
 * features/tournament-skin/model/useSkinActivations.ts
 *
 * Lectura de activaciones para el panel admin. Transporte `apiFetch`; mapea
 * DTO → SkinActivationView en el queryFn (la UI nunca ve el DTO crudo, §19).
 */

import { useQuery } from "@tanstack/react-query";
import type { SkinActivationDto } from "@/entities/skin-activation";
import { apiFetch } from "@/shared/api/client";
import { queryKeys } from "@/shared/api/query-keys";
import { SKIN_ACTIVATIONS_URL } from "../constants";
import { mapSkinActivationToView } from "../lib/map-activation-view";
import { todayIso } from "../lib/today-iso";
import type { SkinActivationView } from "../types";

export function useSkinActivations() {
	return useQuery<SkinActivationView[]>({
		queryKey: queryKeys.skinActivations(),
		queryFn: async () => {
			const res = await apiFetch<SkinActivationDto[]>(SKIN_ACTIVATIONS_URL);
			if (!res.ok) throw new Error(res.error);
			const today = todayIso();
			return res.data.map((dto) => mapSkinActivationToView(dto, today));
		},
	});
}
