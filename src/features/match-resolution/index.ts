// features/match-resolution/index.ts — exportaciones públicas del feature
export { loadMatchForResolution } from "./load-match";
export { resolveMatch } from "./resolve-match";
export { autosaveStat, autosaveMatchField } from "./autosave-stat";
export { addAdHocPlayer } from "./add-ad-hoc-player";
export { validateResolution } from "./lib/validate-resolution";
export {
	computeTeamGoals,
	computeTeamCards,
	computePresentCount,
	computeAttributionGap,
} from "./lib/compute-totals";
export { applyWalkoverDefaults } from "./lib/walkover-defaults";
export { assignNextCedula } from "./lib/assign-cedula";
export { STATUS_LABELS, WALKOVER_STATUSES, CLEAR_STATS_STATUSES } from "./constants";
export type { ResolutionWarning } from "./lib/validate-resolution";
export type { ResolutionState, PlayerStatDraft, TeamSide, SaveStatus } from "./types";
