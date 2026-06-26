"use client";

/**
 * features/team-management/model/useCreateTeam.ts
 *
 * Mutación de alta de equipo (TanStack Query). Transporte `apiFetch`; al crear
 * invalida `leagueTeams` de la liga (el selector de transferencia y cualquier
 * lectura de equipos de esa liga se refrescan por invalidación, no por reload).
 * En `!ok` hace `throw new Error(res.error)` — el error queda en la mutación, sin
 * `catch` que lo silencie (§18.4). El componente lee `isPending`/`error`.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/shared/api/client";
import { queryKeys } from "@/shared/api/query-keys";
import type { Team } from "@/entities/team";
import { TEAMS_URL } from "../constants";
import { mapTeamToCreatedView } from "../lib/map-created-team";
import type { CreatedTeamView } from "../types";
import type { TeamFormInput } from "./team-form-schema";

export function useCreateTeam(leagueId: string) {
	const queryClient = useQueryClient();

	return useMutation<CreatedTeamView, Error, TeamFormInput>({
		mutationFn: async (input) => {
			const res = await apiFetch<Team>(TEAMS_URL, {
				method: "POST",
				body: { name: input.name, leagueId, color: input.color || undefined },
			});
			if (!res.ok) throw new Error(res.error);
			return mapTeamToCreatedView(res.data);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.leagueTeams(leagueId) });
		},
	});
}
