/**
 * features/team-management/constants.ts
 * Magic strings y URLs de API centralizados.
 */

export const TEAM_API_URL = (teamId: string): string => `/api/teams/${teamId}`;

/** Colección de equipos: GET listado / POST alta. */
export const TEAMS_URL = "/api/teams";

/** Presets de color para el alta de equipo (no hardcodear en la UI, §3.5). */
export const COLOR_PRESETS = [
	"#e53e3e",
	"#dd6b20",
	"#d69e2e",
	"#38a169",
	"#3182ce",
	"#6b46c1",
	"#d53f8c",
	"#2d3748",
] as const;

/** Roster V2 (RosterEntry[]) — fuente cliente para TanStack Query. */
export const TEAM_ROSTER_URL = (teamId: string): string => `/api/teams/${teamId}/members`;

export const ROSTER_MEMBER_URL = (teamId: string, memberId: string): string =>
	`/api/teams/${teamId}/roster/${memberId}`;

export const TRANSFER_URL = (teamId: string, memberId: string): string =>
	`/api/teams/${teamId}/roster/${memberId}/transfer`;

export const TEAMS_BY_LEAGUE_URL = (leagueId: string): string => `/api/teams?league_id=${leagueId}`;

/** Búsqueda por nombre de jugadores existentes de la organización (scope liga). */
export const ORG_PLAYER_SEARCH_URL = (leagueId: string, q: string): string =>
	`/api/players/org-search?leagueId=${leagueId}&q=${encodeURIComponent(q)}`;

/** Ventanilla de registro — destino del shortcut "Crear jugador nuevo". */
export const REGISTRO_URL = (leagueId: string): string => `/admin/registro?leagueId=${leagueId}`;

/** Debounce (ms) del buscador por nombre en el modal Agregar jugador. */
export const PLAYER_SEARCH_DEBOUNCE_MS = 300;

export const ROSTER_STATUSES = ["active", "suspended", "inactive"] as const;

export const ROSTER_STATUS_LABEL: Record<string, string> = {
	active: "Activo",
	suspended: "Suspendido",
	inactive: "Inactivo",
};

export const ROSTER_STATUS_CLASS: Record<string, string> = {
	active: "bg-brand/15 text-brand-ink",
	suspended: "bg-yellow-900/40 text-yellow-400",
	inactive: "bg-surface-2 text-ink-3",
};
