"use client";

/**
 * features/team-management/model/useUpdateTeam.ts
 *
 * Mutación de edición del equipo (nombre, color). Transporte `apiFetch`,
 * invalida la caché afectada (`leagueTeams` para el selector de transferencia;
 * `team` para cuando el detalle pase a ser query). Usa `mutate` → el error va al
 * estado, sin `catch` que silencie (§18.4).
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/shared/api/client";
import { queryKeys } from "@/shared/api/query-keys";
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
			queryClient.invalidateQueries({ queryKey: queryKeys.leagueTeams(leagueId) });
			queryClient.invalidateQueries({ queryKey: queryKeys.team(teamId) });
			onSuccess();
		},
	});

	return {
		updateTeam: (data) => mutation.mutate(data),
		isSaving: mutation.isPending,
		error: mutation.error?.message ?? "",
	};
}
