"use client";

/**
 * features/organization-credential-config/model/useUpdateOrgCredentialConfig.ts
 * Guarda la config de modalidades de pase. Feedback obligatorio (AGENTS.md §7.2b).
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type {
	OrganizationCredentialConfigDto,
	UpdateOrganizationCredentialConfigInput,
} from "@/entities/organization-credential-config";
import { apiFetch } from "@/shared/api/client";
import { queryKeys } from "@/shared/api/query-keys";
import { notify } from "@/shared/lib/notify";
import { ORGANIZATION_CREDENTIAL_CONFIG_URL } from "../constants";

export function useUpdateOrgCredentialConfig(organizationId: string) {
	const queryClient = useQueryClient();

	return useMutation<
		OrganizationCredentialConfigDto,
		Error,
		UpdateOrganizationCredentialConfigInput
	>({
		mutationFn: async (input) => {
			const res = await apiFetch<OrganizationCredentialConfigDto>(
				ORGANIZATION_CREDENTIAL_CONFIG_URL(organizationId),
				{ method: "PATCH", body: input },
			);
			if (!res.ok) throw new Error(res.error);
			return res.data;
		},
		onSuccess: (config) => {
			queryClient.setQueryData(queryKeys.organizationCredentialConfig(organizationId), config);
			notify.success("Configuración de credenciales guardada");
		},
		onError: (error) => {
			notify.error(error.message || "No se pudo guardar la configuración");
		},
	});
}
