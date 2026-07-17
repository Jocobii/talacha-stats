"use client";

/**
 * features/organization-credential-config/model/useOrgCredentialConfig.ts
 * Lectura de la config de modalidades de pase — SSR→props igual que
 * useOrganizationRules.
 */

import { useQuery } from "@tanstack/react-query";
import type { OrganizationCredentialConfigDto } from "@/entities/organization-credential-config";
import { apiFetch } from "@/shared/api/client";
import { queryKeys } from "@/shared/api/query-keys";
import { ORGANIZATION_CREDENTIAL_CONFIG_URL } from "../constants";

export function useOrgCredentialConfig(
	organizationId: string,
	initialData: OrganizationCredentialConfigDto,
) {
	return useQuery<OrganizationCredentialConfigDto>({
		queryKey: queryKeys.credentials.orgConfig(organizationId),
		initialData,
		queryFn: async () => {
			const res = await apiFetch<OrganizationCredentialConfigDto>(
				ORGANIZATION_CREDENTIAL_CONFIG_URL(organizationId),
			);
			if (!res.ok) throw new Error(res.error);
			return res.data;
		},
	});
}
