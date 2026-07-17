"use client";

/**
 * features/organization-rules/model/useUpdateOrganizationRules.ts
 * Guarda el default de organización. Feedback obligatorio (§7.2b AGENTS.md).
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type {
	OrganizationConfigDto,
	UpdateOrganizationConfigInput,
} from "@/entities/organization-config";
import { apiFetch } from "@/shared/api/client";
import { queryKeys } from "@/shared/api/query-keys";
import { notify } from "@/shared/lib/notify";
import { ORGANIZATION_CONFIG_URL } from "../constants";
import { mapOrganizationConfigToRulesView } from "../lib/map-rules-view";
import type { OrgRulesFormView } from "../types";

export function useUpdateOrganizationRules(organizationId: string) {
	const queryClient = useQueryClient();

	return useMutation<OrgRulesFormView, Error, UpdateOrganizationConfigInput>({
		mutationFn: async (input) => {
			const res = await apiFetch<OrganizationConfigDto>(ORGANIZATION_CONFIG_URL(organizationId), {
				method: "PATCH",
				body: input,
			});
			if (!res.ok) throw new Error(res.error);
			return mapOrganizationConfigToRulesView(res.data);
		},
		onSuccess: (view) => {
			queryClient.setQueryData(queryKeys.organizations.config(organizationId), view);
			notify.success("Reglamento por defecto guardado");
		},
		onError: (error) => {
			notify.error(error.message || "No se pudo guardar el reglamento");
		},
	});
}
