/**
 * features/tournament-rules/constants.ts
 */

/** GET/PATCH del reglamento de una liga. */
export const LEAGUE_CONFIG_URL = (leagueId: string): string => `/api/leagues/${leagueId}/config`;
