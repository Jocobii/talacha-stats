"use client";

/**
 * features/org-directory/model/useOrgDirectoryFilters.ts
 *
 * Dueño del estado de filtro + "cargar más" del Hub de Portales (§7.3b).
 * `query` se debouncea en el callback de cambio — igual que
 * usePlayersFilters (features/player-directory), nunca `setState` síncrono
 * dentro de un `useEffect` (§7.2).
 *
 * `visibleCount` (cuántos resultados pedir) se resetea a la primera página
 * cuando cambia ciudad, orden o búsqueda ya debounceada — comparado durante
 * el render contra el valor anterior, mismo patrón de "reset por cambio de
 * ciudad" que useNarratorMatchup (features/narrator-analysis), sin efecto.
 */

import { useCallback, useRef, useState } from "react";
import { ORG_DIRECTORY_PAGE_SIZE, ORG_DIRECTORY_SEARCH_DEBOUNCE_MS } from "../constants";
import type { OrgDirectoryFiltersValue } from "../types";
import type { OrgDirectorySort } from "@/entities/organization";

export type OrgDirectoryFilters = {
	city: string;
	setCity: (city: string) => void;
	query: string;
	setQuery: (q: string) => void;
	sort: OrgDirectorySort;
	setSort: (sort: OrgDirectorySort) => void;
	filters: OrgDirectoryFiltersValue;
	visibleCount: number;
	loadMore: () => void;
};

export function useOrgDirectoryFilters(): OrgDirectoryFilters {
	const [city, setCity] = useState("");
	const [sort, setSort] = useState<OrgDirectorySort>("name_asc");

	const [query, setQueryRaw] = useState("");
	const [debouncedQuery, setDebouncedQuery] = useState("");
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const setQuery = useCallback((value: string) => {
		setQueryRaw(value);
		if (timerRef.current) clearTimeout(timerRef.current);
		timerRef.current = setTimeout(() => setDebouncedQuery(value), ORG_DIRECTORY_SEARCH_DEBOUNCE_MS);
	}, []);

	const [visibleCount, setVisibleCount] = useState(ORG_DIRECTORY_PAGE_SIZE);

	// Reset de paginación cuando cambia cualquier filtro real. Comparación
	// durante el render (sin useEffect, §7.2): si la "llave" de filtros
	// cambió desde el último render, se resetea `visibleCount` ahí mismo.
	const [prevKey, setPrevKey] = useState(`${city}|${sort}|${debouncedQuery}`);
	const currentKey = `${city}|${sort}|${debouncedQuery}`;
	if (currentKey !== prevKey) {
		setPrevKey(currentKey);
		setVisibleCount(ORG_DIRECTORY_PAGE_SIZE);
	}

	const loadMore = useCallback(() => {
		setVisibleCount((count) => count + ORG_DIRECTORY_PAGE_SIZE);
	}, []);

	return {
		city,
		setCity,
		query,
		setQuery,
		sort,
		setSort,
		filters: { city, q: debouncedQuery, sort },
		visibleCount,
		loadMore,
	};
}
