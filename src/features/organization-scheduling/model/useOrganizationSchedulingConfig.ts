"use client";

/**
 * features/organization-scheduling/model/useOrganizationSchedulingConfig.ts
 * Lectura del default de sorteo de la organización — SSR→props.
 */

import { useQuery } from "@tanstack/react-query";
import type { OrganizationSchedulingConfigDto } from "@/entities/organization-scheduling-config";
import { apiFetch } from "@/shared/api/client";
import { queryKeys } from "@/shared/api/query-keys";
import { ORGANIZATION_SCHEDULING_CONFIG_URL } from "../constants";

export function useOrganizationSchedulingConfig(
	organizationId: string,
	initialData: OrganizationSchedulingConfigDto,
) {
	return useQuery<OrganizationSchedulingConfigDto>({
		queryKey: queryKeys.organizationSchedulingConfig(organizationId),
		initialData,
		queryFn: async () => {
			const res = await apiFetch<OrganizationSchedulingConfigDto>(
				ORGANIZATION_SCHEDULING_CONFIG_URL(organizationId),
			);
			if (!res.ok) throw new Error(res.error);
			return res.data;
		},
	});
}
