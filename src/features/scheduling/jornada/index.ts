/**
 * features/scheduling/jornada/index.ts
 * Exportaciones públicas del módulo de sorteo por jornada.
 */

export { generateSingleRound } from "./generate-single-round";
export type {
	GenerateSingleRoundInput,
	GenerateSingleRoundResult,
	PurchasedSlotInput,
} from "./generate-single-round";

export { getRecentPairs } from "./get-recent-pairs";

export { assignSingleRoundSlots } from "./assign-single-round-slots";
export type {
	AssignSingleRoundSlotsInput,
	AssignedPairing,
	VenueWithWindows,
} from "./assign-single-round-slots";

export { confirmSingleRound } from "./confirm-single-round";
export type { ConfirmSingleRoundInput, ConfirmPairing } from "./confirm-single-round";
