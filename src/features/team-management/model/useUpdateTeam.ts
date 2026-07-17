"use client";

/**
 * features/team-management/model/useUpdateTeam.ts
 *
 * Mutación de edición del equipo (nombre, color). Transporte `apiFetch`,
 * invalida vía el registro central (`shared/api/cache-invalidation.ts`, §4)
 * `teams.list(leagueId)` (selector de transferencia) y `teams.detail(teamId)`
 * — esta última es prefijo de `teams.roster`, así que de paso refresca el
 * roster si algún día el detalle incluye datos derivados del equipo. Usa
 * `mutate` → el error va al estado, sin `catch` que silencie (§18.4).
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/shared/api/client";
import { invalidate } from "@/shared/api/cache-invalidation";
import { TEAM_API_URL } from "../constants";
import type { TeamFormData } from "../types";

export type UpdateTeamOptions = { onSuccess: () => void };

export type UseUpdateTeamReturn = {
	updateTeam: (data: TeamFormData) => void;
	isSaving: boolean;
	error: string;
};

export function useUpdateTeam(
	teamId: string,
	leagueId: string,
	{ onSuccess }: UpdateTeamOptions,
): UseUpdateTeamReturn {
	const queryClient = useQueryClient();

	const mutation = useMutation({
		mutationFn: async (data: TeamFormData) => {
			const result = await apiFetch(TEAM_API_URL(teamId), {
				method: "PATCH",
				body: { name: data.name, color: data.color || null },
			});
			if (!result.ok) throw new Error(result.error);
		},
		onSuccess: () => {
			invalidate.teamUpdated(queryClient, { leagueId, teamId });
			onSuccess();
		},
	});

	return {
		updateTeam: (data) => mutation.mutate(data),
		isSaving: mutation.isPending,
		error: mutation.error?.message ?? "",
	};
}
