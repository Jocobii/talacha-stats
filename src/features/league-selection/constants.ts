/**
 * features/league-selection/constants.ts
 * Magic strings y URLs del selector de liga.
 */

export const LEAGUES_URL = (city?: string): string =>
	city ? `/api/leagues?city=${encodeURIComponent(city)}` : "/api/leagues";
