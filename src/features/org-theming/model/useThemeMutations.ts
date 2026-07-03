"use client";

/**
 * features/org-theming/model/useThemeMutations.ts
 *
 * Guardado del tema. Invalida orgTheme(organizationId) — el router refresh
 * lo dispara el caller si quiere ver el cambio en la página pública al
 * instante (el público lee de DB por request, no hay caché que purgar).
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/shared/api/client";
import { queryKeys } from "@/shared/api/query-keys";
import { orgThemeUrl, type OrgThemeDto } from "../types";
import type { ThemeFormInput } from "./theme-form-schema";

export function useSaveOrgTheme(organizationId: string) {
	const queryClient = useQueryClient();
	return useMutation<OrgThemeDto, Error, ThemeFormInput>({
		mutationFn: async (input) => {
			const res = await apiFetch<OrgThemeDto>(orgThemeUrl(organizationId), {
				method: "PUT",
				body: input,
			});
			if (!res.ok) throw new Error(res.error);
			return res.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.orgTheme(organizationId) });
		},
	});
}
