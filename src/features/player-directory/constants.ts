/**
 * features/player-directory/constants.ts
 * Magic strings y URLs de API centralizados (§3.5).
 */

/** Directorio público de jugadores: GET con filtro de ciudad + búsqueda por nombre. */
export const PLAYERS_SEARCH_URL = (city: string, q: string): string => {
	const params = new URLSearchParams({ city });
	if (q.trim()) params.set("q", q.trim());
	return `/api/players?${params.toString()}`;
};

/** Debounce (ms) del buscador por nombre del directorio público. */
export const PLAYER_DIRECTORY_SEARCH_DEBOUNCE_MS = 300;
