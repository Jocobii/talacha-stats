// entities/match/index.ts
export type { MatchWithRelations, MatchResolutionData, PlayerResolutionRow } from "./model";
export type {
	MatchStatus,
	MatchPlayerStatInput,
	ResolveMatchInput,
	ResolveMatchResult,
	AutosaveStatInput,
	AutosaveMatchFieldsInput,
} from "./model";
export { MatchStatusSchema, MatchPlayerStatSchema, ResolveMatchSchema } from "./model";
export {
	getMatch,
	listMatchesByMatchday,
	listMatchesByTeamLeague,
	getMatchForResolution,
	listMatchesByRound,
	findMatchByCedula,
	getNextScheduledMatch,
} from "./queries";
