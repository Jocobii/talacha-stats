"use client";

/**
 * features/player-directory/model/usePlayersFilters.ts
 *
 * Dueño del estado de filtro del directorio público de jugadores (§7.3b).
 * `city` se lee directamente de la URL en cada render (la escribe
 * `CityFilter` vía `router.push`, sin estado local que sincronizar).
 * `query` se inicializa con lazy initializer desde `?q=` (llega del buscador
 * del hero del home) y se debouncea en el callback de cambio — nunca
 * `setState` síncrono dentro de un `useEffect` (§7.2).
 */

import { useCallback, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PLAYER_DIRECTORY_SEARCH_DEBOUNCE_MS } from "../constants";

export type PlayersFilters = {
	city: string;
	query: string;
	debouncedQuery: string;
	setQuery: (value: string) => void;
};

export function usePlayersFilters(): PlayersFilters {
	const searchParams = useSearchParams();
	const city = searchParams.get("city") ?? "Tijuana";

	const [query, setQueryRaw] = useState(() => searchParams.get("q") ?? "");
	const [debouncedQuery, setDebouncedQuery] = useState(query);
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const setQuery = useCallback((value: string) => {
		setQueryRaw(value);
		if (timerRef.current) clearTimeout(timerRef.current);
		timerRef.current = setTimeout(
			() => setDebouncedQuery(value),
			PLAYER_DIRECTORY_SEARCH_DEBOUNCE_MS,
		);
	}, []);

	return { city, query, debouncedQuery, setQuery };
}
