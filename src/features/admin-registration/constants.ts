/**
 * features/admin-registration/constants.ts
 * Magic values centralizados — nunca hardcodear en componentes o hooks.
 */

export const CURP_LENGTH = 18;
export const CURP_REGEX = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/;
export const LOOKUP_DEBOUNCE_MS = 400;
export const TEAMS_API_URL = (leagueId: string) => `/api/teams?league_id=${leagueId}`;
export const LOOKUP_API_URL = (curp: string) =>
	`/api/players/lookup?curp=${encodeURIComponent(curp)}`;
export const REGISTER_API_URL = "/api/players/register";

/**
 * Estado de credencial + scopeOptions de la org para la liga seleccionada
 * (docs/CREDENCIAL-PASE-JUGADOR.md, pantalla A del paso 3). globalPlayerId es
 * opcional — un jugador "not_found" (paso 2) todavía no tiene uno.
 */
export const CREDENTIAL_STATUS_URL = (leagueId: string, globalPlayerId: string | null): string => {
	const qs = new URLSearchParams({ leagueId });
	if (globalPlayerId) qs.set("globalPlayerId", globalPlayerId);
	return `/api/player-credentials?${qs.toString()}`;
};

export const MONTHS_ES = [
	"ene",
	"feb",
	"mar",
	"abr",
	"may",
	"jun",
	"jul",
	"ago",
	"sep",
	"oct",
	"nov",
	"dic",
] as const;
