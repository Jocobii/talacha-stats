/**
 * features/discipline/constants.ts
 */

import { DEFAULT_LIST_PAGE_SIZE, LIST_PAGE_SIZE_OPTIONS } from "@/shared/ui/admin-table.helpers";

/** GET (listado + roster) / POST (alta manual) de suspensiones de una liga. */
export const LEAGUE_SUSPENSIONS_URL = (leagueId: string): string =>
	`/api/leagues/${leagueId}/suspensions`;

/**
 * GET roster con búsqueda por nombre (primeros 10, o los que matcheen `q`) —
 * picker "autocomplete" del jugador en "Registrar sanción". Mismo endpoint
 * que LEAGUE_SUSPENSIONS_URL (trae `{ suspensions, roster }`), solo agrega
 * `?q=`.
 */
export const LEAGUE_ROSTER_SEARCH_URL = (leagueId: string, q: string): string =>
	`${LEAGUE_SUSPENSIONS_URL(leagueId)}?q=${encodeURIComponent(q)}`;

/**
 * GET búsqueda de jugador por nombre, org/owner-wide (scope resuelto
 * server-side por sesión) — paso 1 de "Registrar sanción" en modo global
 * (B7b): buscar jugador primero, elegir liga entre sus membresías después.
 */
export const DISCIPLINE_PLAYER_SEARCH_URL = (q: string): string =>
	`/api/admin/suspensions/players?q=${encodeURIComponent(q)}`;

/** PATCH (escalar / levantar) una suspensión puntual. */
export const SUSPENSION_URL = (suspensionId: string): string => `/api/suspensions/${suspensionId}`;

/** GET listado global de suspensiones + ligas visibles (B7b, /admin/suspensiones). */
export const ADMIN_SUSPENSIONS_URL = "/api/admin/suspensions";

/**
 * /admin/suspensiones (B7b) — molde "módulo data-heavy", espejo de
 * PLAYERS_BASE_PATH/TEAMS_BASE_PATH. El tamaño/opciones de página son el
 * contrato compartido de los módulos data-heavy (shared/ui/admin-table.helpers).
 */
export const SUSPENSIONS_BASE_PATH = "/admin/suspensiones";
export const DEFAULT_SUSPENSIONS_PAGE_SIZE = DEFAULT_LIST_PAGE_SIZE;
export const SUSPENSIONS_PAGE_SIZE_OPTIONS = LIST_PAGE_SIZE_OPTIONS;
