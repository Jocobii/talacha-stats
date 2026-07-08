"use client";

/**
 * features/team-management/model/useAddExistingPlayer.ts
 *
 * Orquestador del modal "Agregar jugador": une el buscador por nombre
 * (useOrgPlayerSearch) con la mutación de alta (useAddMemberMutation) y maneja
 * la selección + dorsal. El debounce se resuelve en el callback de cambio (nunca
 * `setState` síncrono dentro de un `useEffect`, §7.2).
 */

import { useCallback, useRef, useState } from "react";
import { useOrgPlayerSearch } from "./useOrgPlayerSearch";
import { useAddMemberMutation } from "./useAddMemberMutation";
import { PLAYER_SEARCH_DEBOUNCE_MS } from "../constants";
import type { OrgPlayerSearchResult } from "../types";

export function useAddExistingPlayer(leagueId: string, teamId: string, onSuccess: () => void) {
	const [query, setQueryRaw] = useState("");
	const [debounced, setDebounced] = useState("");
	const [selected, setSelected] = useState<OrgPlayerSearchResult | null>(null);
	const [dorsal, setDorsal] = useState("");
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const search = useOrgPlayerSearch(leagueId, debounced);
	const mutation = useAddMemberMutation(teamId, onSuccess);

	const setQuery = useCallback((value: string) => {
		setQueryRaw(value);
		if (timerRef.current) clearTimeout(timerRef.current);
		timerRef.current = setTimeout(() => setDebounced(value), PLAYER_SEARCH_DEBOUNCE_MS);
	}, []);

	const submit = useCallback(() => {
		if (!selected) return;
		mutation.mutate({
			globalPlayerId: selected.globalPlayerId,
			dorsal: dorsal ? parseInt(dorsal, 10) : null,
		});
	}, [selected, dorsal, mutation]);

	return {
		query,
		setQuery,
		results: search.data ?? [],
		searching: search.isFetching && debounced.trim().length >= 2,
		selected,
		setSelected,
		dorsal,
		setDorsal,
		submit,
		submitting: mutation.isPending,
		error: mutation.error instanceof Error ? mutation.error.message : "",
	};
}
