"use client";

/**
 * shared/hooks/useLeagues.ts
 *
 * Lectura (TanStack Query) de las ligas activas para el selector compartido
 * (`shared/ui/LeagueSelect`). Reemplaza el fetch-en-useEffect.
 *
 * - `/api/leagues` ya devuelve SOLO ligas activas por defecto (filtro en DB),
 *   así que no se filtra por `status` en cliente (§17.3 Thin Client).
 * - `queryFn` mapea el DTO crudo a `LeagueOption` con el mapper (§19): la UI
 *   nunca ve la fila cruda.
 * - Vive en `shared` (lo consume `shared/ui`): solo depende de `shared/*`.
 */

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/shared/api/client";
import { queryKeys } from "@/shared/api/query-keys";
import {
	mapLeagueToOption,
	type LeagueOptionDto,
	type LeagueOption,
} from "@/shared/lib/map-league-option";

function buildLeaguesUrl(city?: string): string {
	return city ? `/api/leagues?city=${encodeURIComponent(city)}` : "/api/leagues";
}

export function useLeagues(city?: string) {
	return useQuery({
		queryKey: queryKeys.leagues(city ? { city } : undefined),
		queryFn: async (): Promise<LeagueOption[]> => {
			const result = await apiFetch<LeagueOptionDto[]>(buildLeaguesUrl(city));
			if (!result.ok) throw new Error(result.error);
			return result.data.map(mapLeagueToOption);
		},
	});
}
