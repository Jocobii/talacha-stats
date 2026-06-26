"use client";

/**
 * shared/hooks/useCities.ts
 *
 * Lectura (TanStack Query) de las ciudades con al menos una liga. Reemplaza el
 * fetch-en-useEffect de los widgets compartidos (CityFilter). Vive en `shared`
 * porque lo consumen componentes de `shared/ui`: solo depende de `shared/api`
 * (apiFetch, queryKeys), nunca de features/entities (FSD).
 *
 * Las ciudades son datos casi estáticos (tier "estático", FRONTEND-DATA-STRATEGY)
 * → staleTime alto para evitar refetch en cada montaje del selector.
 */

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/shared/api/client";
import { queryKeys } from "@/shared/api/query-keys";

const CITIES_URL = "/api/cities";
const CITIES_STALE_TIME = 5 * 60 * 1000;

export function useCities() {
	return useQuery({
		queryKey: queryKeys.cities(),
		staleTime: CITIES_STALE_TIME,
		queryFn: async (): Promise<string[]> => {
			const result = await apiFetch<string[]>(CITIES_URL);
			if (!result.ok) throw new Error(result.error);
			return result.data;
		},
	});
}
