/**
 * features/onboarding-wizard/constants.ts
 * Magic values centralizados del wizard de onboarding unificado
 * (Identidad → Operación → Horario).
 */

export const ONBOARDING_STEPS: string[] = ["Identidad", "Operación", "Horario"];

export const ORGANIZATIONS_URL = "/api/organizations";
export const orgThemeUrl = (organizationId: string): string =>
	`/api/organizations/${organizationId}/theme`;
export const checkSlugUrl = (slug: string): string =>
	`/api/organizations/check-slug?slug=${encodeURIComponent(slug)}`;

export const VENUES_URL = "/api/venues";
export const QUICK_CREATE_LEAGUE_URL = "/api/leagues/quick-create";
export const leagueVenuesUrl = (leagueId: string): string => `/api/leagues/${leagueId}/venues`;
export const leagueVenueWindowsUrl = (leagueId: string, venueId: string): string =>
	`/api/leagues/${leagueId}/venues/${venueId}/windows`;

/** Debounce del chequeo de disponibilidad de slug (paso Identidad). */
export const SLUG_CHECK_DEBOUNCE_MS = 450;
