/**
 * features/org-home-search/constants.ts
 * Magic strings del buscador de equipos del home del subdominio (Zona 1).
 */

export const ORG_TEAM_SEARCH_URL = (slug: string, q: string): string =>
	`/api/org/${slug}/search-teams?q=${encodeURIComponent(q)}`;

/** Mismo umbral que team-management/discipline: 2 letras mínimo, 300ms debounce. */
export const SEARCH_MIN_CHARS = 2;
export const SEARCH_DEBOUNCE_MS = 300;
