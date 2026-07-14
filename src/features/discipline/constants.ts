/**
 * features/discipline/constants.ts
 */

/** GET (listado + roster) / POST (alta manual) de suspensiones de una liga. */
export const LEAGUE_SUSPENSIONS_URL = (leagueId: string): string =>
	`/api/leagues/${leagueId}/suspensions`;

/** PATCH (escalar / levantar) una suspensión puntual. */
export const SUSPENSION_URL = (suspensionId: string): string => `/api/suspensions/${suspensionId}`;

/** GET global (B7b) — suspensiones + ligas de todas las ligas visibles para el usuario. */
export const ADMIN_SUSPENSIONS_URL = "/api/admin/suspensions";
