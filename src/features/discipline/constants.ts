/**
 * features/discipline/constants.ts
 */

import { DEFAULT_LIST_PAGE_SIZE, LIST_PAGE_SIZE_OPTIONS } from "@/shared/ui/admin-table.helpers";

/** GET (listado + roster) / POST (alta manual) de suspensiones de una liga. */
export const LEAGUE_SUSPENSIONS_URL = (leagueId: string): string =>
	`/api/leagues/${leagueId}/suspensions`;

/** PATCH (escalar / levantar) una suspensión puntual. */
export const SUSPENSION_URL = (suspensionId: string): string => `/api/suspensions/${suspensionId}`;

/**
 * /admin/suspensiones (B7b) — molde "módulo data-heavy", espejo de
 * PLAYERS_BASE_PATH/TEAMS_BASE_PATH. El tamaño/opciones de página son el
 * contrato compartido de los módulos data-heavy (shared/ui/admin-table.helpers).
 */
export const SUSPENSIONS_BASE_PATH = "/admin/suspensiones";
export const DEFAULT_SUSPENSIONS_PAGE_SIZE = DEFAULT_LIST_PAGE_SIZE;
export const SUSPENSIONS_PAGE_SIZE_OPTIONS = LIST_PAGE_SIZE_OPTIONS;
