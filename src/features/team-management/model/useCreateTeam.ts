"use client";

/**
 * features/team-management/model/useCreateTeam.ts
 *
 * Mutación de alta de equipo (TanStack Query). Transporte `apiFetch`; al crear
 * invalida `teams.list(leagueId)` vía el registro central
 * (`shared/api/cache-invalidation.ts`, §4 del estándar de caché) — el selector
 * de transferencia y cualquier lectura de equipos de esa liga se refrescan por
 * invalidación, no por reload. En `!ok` hace `throw new Error(res.error)` — el
 * error queda en la mutación, sin `catch` que lo silencie (§18.4). El
 * componente lee `isPending`/`error`.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/shared/api/client";
import { invalidate } from "@/shared/api/cache-invalidation";
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
			invalidate.teamCreated(queryClient, { leagueId });
		},
	});
}
