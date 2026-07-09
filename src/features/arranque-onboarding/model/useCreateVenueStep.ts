"use client";

/**
 * features/arranque-onboarding/model/useCreateVenueStep.ts
 * Mutación de alta de cancha (Paso 1). Transporte `apiFetch`; invalida
 * `venues` de la org al crear para que el pool global (/admin/canchas) quede
 * consistente si el usuario navega ahí después.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/shared/api/client";
import { queryKeys } from "@/shared/api/query-keys";
import type { Venue } from "@/entities/venue";
import type { CreateVenueInput } from "@/types";
import { VENUES_URL } from "../constants";
import { mapVenueToChip } from "../lib/map-venue-to-chip";
import type { CreatedVenueView } from "../types";

export function useCreateVenueStep(organizationId: string) {
	const queryClient = useQueryClient();

	return useMutation<CreatedVenueView, Error, CreateVenueInput>({
		mutationFn: async (input) => {
			const res = await apiFetch<Venue>(VENUES_URL, { method: "POST", body: input });
			if (!res.ok) throw new Error(res.error);
			return mapVenueToChip(res.data);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.venues({ orgId: organizationId }) });
		},
	});
}
