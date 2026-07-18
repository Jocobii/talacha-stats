"use client";

/**
 * features/organization-rules/model/useOrganizationRules.ts
 * Lectura del reglamento por defecto de la organización — SSR→props igual
 * que useLeagueRules.
 */

import { useQuery } from "@tanstack/react-query";
import type { OrganizationConfigDto } from "@/entities/organization-config";
import { apiFetch } from "@/shared/api/client";
import { queryKeys } from "@/shared/api/query-keys";
import { ORGANIZATION_CONFIG_URL } from "../constants";
import { mapOrganizationConfigToRulesView } from "../lib/map-rules-view";
import type { OrgRulesFormView } from "../types";

export function useOrganizationRules(organizationId: string, initialView: OrgRulesFormView) {
	return useQuery<OrgRulesFormView>({
		queryKey: queryKeys.organizations.config(organizationId),
		initialData: initialView,
		queryFn: async () => {
			const res = await apiFetch<OrganizationConfigDto>(ORGANIZATION_CONFIG_URL(organizationId));
			if (!res.ok) throw new Error(res.error);
			return mapOrganizationConfigToRulesView(res.data);
		},
	});
}
