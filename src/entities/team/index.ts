/**
 * entities/team/index.ts
 * Exportaciones publicas. App/ y features/ solo importan desde aqui.
 */

export {
	getTeam,
	getTeamWithLeague,
	listTeamsByLeague,
	getTeamsForTransfer,
	getTeamRoster,
} from "./queries";

export type {
	Team,
	LeagueMember,
	RosterEntry,
	TeamWithLeague,
	UpdateTeamData,
	UpdateRosterMemberData,
	TransferPlayerData,
} from "./model";

export { UpdateTeamSchema, UpdateRosterMemberSchema, TransferPlayerSchema } from "./model";
