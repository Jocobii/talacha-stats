"use client";

/**
 * features/organization-profile/model/useUpdateOrganizationGeneral.ts
 * Guarda nombre/slug/ciudad/logo contra el PATCH que ya existía
 * (`entities/organization`). Feedback obligatorio (§7.2b AGENTS.md).
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UpdateOrganizationInput } from "@/entities/organization";
import { apiFetch } from "@/shared/api/client";
import { queryKeys } from "@/shared/api/query-keys";
import { notify } from "@/shared/lib/notify";
import { organizationUrl } from "../constants";
import type { OrganizationGeneralDto } from "../types";

export function useUpdateOrganizationGeneral(organizationId: string) {
	const queryClient = useQueryClient();

	return useMutation<OrganizationGeneralDto, Error, UpdateOrganizationInput>({
		mutationFn: async (input) => {
			const res = await apiFetch<OrganizationGeneralDto>(organizationUrl(organizationId), {
				method: "PATCH",
				body: input,
			});
			if (!res.ok) throw new Error(res.error);
			return res.data;
		},
		onSuccess: (data) => {
			queryClient.setQueryData(queryKeys.organizations.general(organizationId), data);
			notify.success("Cambios guardados");
		},
		onError: (error) => {
			notify.error(error.message || "No se pudo guardar la organización");
		},
	});
}
