/**
 * features/league-onboarding/constants.ts
 * Magic values centralizados — no hardcodear en subcomponentes.
 */

export const TEAM_COLORS: string[] = [
	"#00E676",
	"#3B82F6",
	"#F59E0B",
	"#EC4899",
	"#A855F7",
	"#EF4444",
	"#06B6D4",
	"#F97316",
];

export const WIZARD_STEPS: string[] = ["Equipos", "Jugadores", "Listo"];

export const BULK_TEAMS_URL = (leagueId: string): string => `/api/leagues/${leagueId}/teams/bulk`;

export const REGISTRATION_URL = (leagueId: string, teamId?: string): string => {
	const base = `/admin/registro?leagueId=${leagueId}`;
	return teamId ? `${base}&teamId=${teamId}` : base;
};

export const EXCEL_IMPORT_URL = (leagueId: string): string =>
	`/admin/imports?leagueId=${leagueId}&from=new-league`;
