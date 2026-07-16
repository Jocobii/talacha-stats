/**
 * features/player-admin/constants.ts
 * Magic numbers de la feature — AGENTS.md §3.5 (nada de hardcoding disperso).
 * El tamaño/opciones de página son el contrato compartido de los módulos
 * data-heavy (ver shared/ui/admin-table.helpers) — solo la ruta base es
 * específica de jugadores.
 */

import { DEFAULT_LIST_PAGE_SIZE, LIST_PAGE_SIZE_OPTIONS } from "@/shared/ui/admin-table.helpers";

export const PLAYERS_BASE_PATH = "/admin/players";

/** Filas por página por defecto en /admin/players (owner y organizador). */
export const DEFAULT_PLAYERS_PAGE_SIZE = DEFAULT_LIST_PAGE_SIZE;

/** Opciones que ofrece el selector "Filas por página". */
export const PLAYERS_PAGE_SIZE_OPTIONS = LIST_PAGE_SIZE_OPTIONS;
