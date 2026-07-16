/**
 * features/league-admin/constants.ts
 * Magic numbers de la feature — AGENTS.md §3.5. El tamaño/opciones de página
 * son el contrato compartido de los módulos data-heavy (ver
 * shared/ui/admin-table.helpers) — solo la ruta base es específica de ligas.
 */

import { DEFAULT_LIST_PAGE_SIZE, LIST_PAGE_SIZE_OPTIONS } from "@/shared/ui/admin-table.helpers";

export const LEAGUES_BASE_PATH = "/admin/leagues";

/** Filas por página por defecto en /admin/leagues (owner y organizador). */
export const DEFAULT_LEAGUES_PAGE_SIZE = DEFAULT_LIST_PAGE_SIZE;

/** Opciones que ofrece el selector "Filas por página". */
export const LEAGUES_PAGE_SIZE_OPTIONS = LIST_PAGE_SIZE_OPTIONS;
