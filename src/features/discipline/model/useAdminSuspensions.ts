"use client";

/**
 * features/discipline/model/useAdminSuspensions.ts
 * Lee suspensiones + ligas visibles del usuario (B7b, vista global).
 * SSR→props: la página baja `initialData` para el primer render.
 */

import { useQuery } from "@tanstack/react-query";
import type { GlobalSuspensionListItemDto, SuspensionLeagueOption } from "@/entities/suspension";
import { apiFetch } from "@/shared/api/client";
import { queryKeys } from "@/shared/api/query-keys";
import { ADMIN_SUSPENSIONS_URL } from "../constants";

export type AdminSuspensionsData = {
	suspensions: GlobalSuspensionListItemDto[];
	leagues: SuspensionLeagueOption[];
};

export function useAdminSuspensions(initialData: AdminSuspensionsData) {
	return useQuery<AdminSuspensionsData>({
		queryKey: queryKeys.adminSuspensions(),
		queryFn: async () => {
			const res = await apiFetch<AdminSuspensionsData>(ADMIN_SUSPENSIONS_URL);
			if (!res.ok) throw new Error(res.error);
			return res.data;
		},
		initialData,
	});
}
