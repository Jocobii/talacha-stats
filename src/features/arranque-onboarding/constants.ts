/**
 * features/arranque-onboarding/constants.ts
 * Magic values centralizados del wizard de Arranque (Cancha → Liga → Horario).
 */

export const ARRANQUE_STEPS: string[] = ["Cancha", "Liga", "Horario", "Listo"];

export const VENUES_URL = "/api/venues";
export const QUICK_CREATE_LEAGUE_URL = "/api/leagues/quick-create";
export const leagueVenuesUrl = (leagueId: string): string => `/api/leagues/${leagueId}/venues`;
export const leagueVenueWindowsUrl = (leagueId: string, venueId: string): string =>
	`/api/leagues/${leagueId}/venues/${venueId}/windows`;
