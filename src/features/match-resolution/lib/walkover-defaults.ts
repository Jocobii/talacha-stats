/**
 * features/match-resolution/lib/walkover-defaults.ts
 * Valores por defecto para partidos walkover (W.O.).
 */
import { WALKOVER_DEFAULT_SCORE } from "../constants";

type WalkoverStatus = "walkover_home" | "walkover_away";

type WalkoverDefaults = {
	homeScore: number;
	awayScore: number;
	homeBonusGoals: number;
	awayBonusGoals: number;
};

/**
 * walkover_home = visitante no se presentó → 3-0 a favor del local.
 * walkover_away = local no se presentó → 0-3 a favor del visitante.
 */
export function applyWalkoverDefaults(status: WalkoverStatus): WalkoverDefaults {
	const { winner, loser } = WALKOVER_DEFAULT_SCORE;
	return {
		homeScore: status === "walkover_home" ? winner : loser,
		awayScore: status === "walkover_away" ? winner : loser,
		homeBonusGoals: 0,
		awayBonusGoals: 0,
	};
}
