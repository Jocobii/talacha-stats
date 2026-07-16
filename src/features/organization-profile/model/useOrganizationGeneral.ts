"use client";

/**
 * features/organization-profile/model/useOrganizationGeneral.ts
 * Lee General (nombre/slug/ciudad/logo). El Server Component baja el valor
 * inicial como `initialData` — mismo patrón SSR→props que useLeagueRules.
 */

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/shared/api/client";
import { queryKeys } from "@/shared/api/query-keys";
import { organizationUrl } from "../constants";
import type { OrganizationGeneralDto } from "../types";

export function useOrganizationGeneral(
	organizationId: string,
	initialData: OrganizationGeneralDto,
) {
	return useQuery<OrganizationGeneralDto>({
		queryKey: queryKeys.organizationGeneral(organizationId),
		initialData,
		queryFn: async () => {
			const res = await apiFetch<OrganizationGeneralDto>(organizationUrl(organizationId));
			if (!res.ok) throw new Error(res.error);
			return {
				id: res.data.id,
				name: res.data.name,
				slug: res.data.slug,
				city: res.data.city,
				logoUrl: res.data.logoUrl ?? null,
			};
		},
	});
}
