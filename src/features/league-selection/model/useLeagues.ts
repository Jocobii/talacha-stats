"use client";

/**
 * features/league-selection/model/useLeagues.ts
 *
 * Lectura (TanStack Query) de las ligas activas para el selector de liga.
 * Reemplaza el fetch-en-useEffect del antiguo `shared/ui/LeagueSelect`.
 *
 * - El genérico de `apiFetch<League[]>` sale del tipo nombrado de la entidad
 *   (`@/entities/league`, §7.4): nada de shapes inline ni re-declarados a mano.
 * - `/api/leagues` ya devuelve SOLO ligas activas por defecto (filtro en DB), así
 *   que no se filtra por `status` en cliente (§17.3 Thin Client).
 * - `queryFn` mapea el DTO crudo a `LeagueOption` con el mapper (§19): la UI nunca
 *   ve la fila cruda.
 */

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/shared/api/client";
import { queryKeys } from "@/shared/api/query-keys";
import type { League } from "@/entities/league";
import { LEAGUES_URL } from "../constants";
import { mapLeagueToOption } from "../lib/map-league-option";
import type { LeagueOption } from "../types";

export function useLeagues(city?: string) {
	return useQuery({
		queryKey: queryKeys.leagues.list(city ? { city } : undefined),
		queryFn: async (): Promise<LeagueOption[]> => {
			const result = await apiFetch<League[]>(LEAGUES_URL(city));
			if (!result.ok) throw new Error(result.error);
			return result.data.map(mapLeagueToOption);
		},
	});
}
