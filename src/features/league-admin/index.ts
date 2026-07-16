/**
 * features/league-admin/index.ts
 * Exportaciones públicas. app/ solo importa desde aquí.
 */

export { getLeaguesView } from "./lib/get-leagues-view";
export type { LeaguesViewModel } from "./lib/get-leagues-view";

export type { LeagueFilterChip } from "./lib/chips";
