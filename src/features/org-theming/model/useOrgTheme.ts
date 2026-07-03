"use client";

/**
 * features/org-theming/model/useOrgTheme.ts
 *
 * Lectura del tema de la org para el panel admin. data === null significa
 * "sin tema configurado" (la org usa la paleta TalachaStats).
 */

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/shared/api/client";
import { queryKeys } from "@/shared/api/query-keys";
import { orgThemeUrl, type OrgThemeDto } from "../types";

export function useOrgTheme(organizationId: string) {
	return useQuery<OrgThemeDto | null, Error>({
		queryKey: queryKeys.orgTheme(organizationId),
		queryFn: async () => {
			const res = await apiFetch<OrgThemeDto | null>(orgThemeUrl(organizationId));
			if (!res.ok) throw new Error(res.error);
			return res.data;
		},
	});
}
