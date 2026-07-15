/**
 * features/player-admin/constants.ts
 * Magic numbers de la feature — AGENTS.md §3.5 (nada de hardcoding disperso).
 */

export const PLAYERS_BASE_PATH = "/admin/players";

/** Filas por página por defecto en /admin/players (owner y organizador). */
export const DEFAULT_PLAYERS_PAGE_SIZE = 10;

/** Opciones que ofrece el selector "Filas por página". */
export const PLAYERS_PAGE_SIZE_OPTIONS = [10, 30, 50, 100] as const;
