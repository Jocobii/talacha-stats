/**
 * features/team-admin/index.ts
 * Exportaciones públicas. app/ solo importa desde aquí.
 */

export { getOwnerTeamsView } from "./lib/get-owner-teams-view";
export type { OwnerTeamsView } from "./lib/get-owner-teams-view";

export { getOrgTeamsView } from "./lib/get-org-teams-view";
export type { OrgTeamsView } from "./lib/get-org-teams-view";

export type { TeamFilterChip } from "./lib/chips";
