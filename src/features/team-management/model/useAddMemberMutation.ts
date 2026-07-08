"use client";

/**
 * features/team-management/model/useAddMemberMutation.ts
 *
 * Mutación para agregar un jugador existente al equipo. El endpoint devuelve el
 * roster ya actualizado, así que lo escribimos directo en la caché (sin refetch)
 * y notificamos al padre para cerrar el modal.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/shared/api/client";
import { queryKeys } from "@/shared/api/query-keys";
import { TEAM_ROSTER_URL } from "../constants";
import type { RosterEntry } from "../types";

export type AddMemberVars = { globalPlayerId: string; dorsal: number | null };

export function useAddMemberMutation(teamId: string, onSuccess: () => void) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (vars: AddMemberVars): Promise<RosterEntry[]> => {
			const res = await apiFetch<RosterEntry[]>(TEAM_ROSTER_URL(teamId), {
				method: "POST",
				body: vars,
			});
			if (!res.ok) throw new Error(res.error);
			return res.data;
		},
		onSuccess: (roster) => {
			queryClient.setQueryData(queryKeys.teamRoster(teamId), roster);
			onSuccess();
		},
	});
}
