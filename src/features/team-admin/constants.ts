/**
 * features/team-admin/constants.ts
 * Magic numbers de la feature — AGENTS.md §3.5 (nada de hardcoding disperso).
 * El tamaño/opciones de página son el contrato compartido de los módulos
 * data-heavy (ver shared/ui/admin-table.helpers) — solo la ruta base es
 * específica de equipos.
 */

import { DEFAULT_LIST_PAGE_SIZE, LIST_PAGE_SIZE_OPTIONS } from "@/shared/ui/admin-table.helpers";

export const TEAMS_BASE_PATH = "/admin/teams";

/** Filas por página por defecto en /admin/teams (owner y organizador). */
export const DEFAULT_TEAMS_PAGE_SIZE = DEFAULT_LIST_PAGE_SIZE;

/** Opciones que ofrece el selector "Filas por página". */
export const TEAMS_PAGE_SIZE_OPTIONS = LIST_PAGE_SIZE_OPTIONS;
