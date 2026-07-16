"use client";

/**
 * features/organization-scheduling/model/useUpdateOrganizationSchedulingConfig.ts
 * Guarda el default de sorteo. Feedback obligatorio (§7.2b AGENTS.md).
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type {
	OrganizationSchedulingConfigDto,
	UpdateOrganizationSchedulingConfigInput,
} from "@/entities/organization-scheduling-config";
import { apiFetch } from "@/shared/api/client";
import { queryKeys } from "@/shared/api/query-keys";
import { notify } from "@/shared/lib/notify";
import { ORGANIZATION_SCHEDULING_CONFIG_URL } from "../constants";

export function useUpdateOrganizationSchedulingConfig(organizationId: string) {
	const queryClient = useQueryClient();

	return useMutation<
		OrganizationSchedulingConfigDto,
		Error,
		UpdateOrganizationSchedulingConfigInput
	>({
		mutationFn: async (input) => {
			const res = await apiFetch<OrganizationSchedulingConfigDto>(
				ORGANIZATION_SCHEDULING_CONFIG_URL(organizationId),
				{ method: "PATCH", body: input },
			);
			if (!res.ok) throw new Error(res.error);
			return res.data;
		},
		onSuccess: (data) => {
			queryClient.setQueryData(queryKeys.organizationSchedulingConfig(organizationId), data);
			notify.success("Parámetros de sorteo guardados");
		},
		onError: (error) => {
			notify.error(error.message || "No se pudo guardar el sorteo");
		},
	});
}
