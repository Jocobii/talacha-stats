/**
 * entities/league/index.ts
 * Exportaciones publicas. App/ y features/ solo importan desde aqui.
 */

export { listOrgLeagueOptions, listLeaguesAdmin, countLeaguesAdmin } from "./queries";
export type { LeagueOption, LeagueAdminRow, LeagueAdminScope } from "./queries";

export type { League, NewLeague } from "./model";
