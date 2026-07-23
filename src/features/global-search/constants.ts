/**
 * features/global-search/constants.ts
 * Magic strings del buscador universal por organización (Fase C,
 * docs/UNIVERSAL-SEARCH.md §5). Mismo umbral/debounce que org-home-search.
 */

export const GLOBAL_SEARCH_URL = (slug: string, q: string): string =>
	`/api/org/${slug}/search?q=${encodeURIComponent(q)}`;

export const SEARCH_MIN_CHARS = 2;
export const SEARCH_DEBOUNCE_MS = 300;
