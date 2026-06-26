"use client";

/**
 * features/match-resolution/model/useAddAdHocPlayer.ts
 *
 * Mutación de alta de jugador ad-hoc (TanStack Query). Transporte `apiFetch`
 * (no `fetch()` desnudo, §11); el genérico sale del DTO nombrado de la entidad
 * (`AdHocPlayerResult`, §7.4). En `!ok` hace `throw new Error(res.error)` — el
 * error queda en la mutación, sin `catch` que lo silencie (§18.4). El componente
 * lee `isPending`/`error` y mapea el resultado con el mapper en `onSuccess`.
 */

import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/shared/api/client";
import type { AdHocPlayerResult } from "@/entities/match-player-stat";
import { MATCH_PLAYERS_URL } from "../constants";
import type { TeamSide } from "../types";
import type { AdHocPlayerFormInput } from "./ad-hoc-form-schema";

type AddAdHocVars = AdHocPlayerFormInput & { teamSide: TeamSide };

export function useAddAdHocPlayer(matchId: string) {
	return useMutation<AdHocPlayerResult, Error, AddAdHocVars>({
		mutationFn: async ({ teamSide, fullName, shirtNumber }) => {
			const res = await apiFetch<AdHocPlayerResult>(MATCH_PLAYERS_URL(matchId), {
				method: "POST",
				body: { teamSide, fullName: fullName.trim(), shirtNumber },
			});
			if (!res.ok) throw new Error(res.error);
			return res.data;
		},
	});
}
