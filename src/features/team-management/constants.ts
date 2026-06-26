/**
 * features/team-management/constants.ts
 * Magic strings y URLs de API centralizados.
 */

export const TEAM_API_URL = (teamId: string): string => `/api/teams/${teamId}`;

/** Roster V2 (RosterEntry[]) — fuente cliente para TanStack Query. */
export const TEAM_ROSTER_URL = (teamId: string): string => `/api/teams/${teamId}/members`;

export const ROSTER_MEMBER_URL = (teamId: string, memberId: string): string =>
	`/api/teams/${teamId}/roster/${memberId}`;

export const TRANSFER_URL = (teamId: string, memberId: string): string =>
	`/api/teams/${teamId}/roster/${memberId}/transfer`;

export const TEAMS_BY_LEAGUE_URL = (leagueId: string): string => `/api/teams?league_id=${leagueId}`;

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
