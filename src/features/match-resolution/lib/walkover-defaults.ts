/**
 * features/match-resolution/lib/walkover-defaults.ts
 * Valores por defecto para partidos walkover (W.O.).
 */
import { WALKOVER_DEFAULT_SCORE } from "../constants";
import type { ResolutionState } from "../types";

type WalkoverStatus = "walkover_home" | "walkover_away";

type WalkoverDefaults = {
	homeScore: number;
	awayScore: number;
	homeBonusGoals: number;
	awayBonusGoals: number;
};

export function isWalkoverStatus(status: string): status is WalkoverStatus {
	return status === "walkover_home" || status === "walkover_away";
}

/**
 * walkover_home = visitante no se presentó → 3-0 a favor del local.
 * walkover_away = local no se presentó → 0-3 a favor del visitante.
 *
 * Los goles del ganador se atribuyen directo a "goles de equipo" (bonus),
 * nunca por jugador — no hubo partido real que justifique repartirlos. El
 * equipo ausente no anota nada.
 */
export function applyWalkoverDefaults(status: WalkoverStatus): WalkoverDefaults {
	const { winner } = WALKOVER_DEFAULT_SCORE;
	return {
		homeScore: status === "walkover_home" ? winner : 0,
		awayScore: status === "walkover_away" ? winner : 0,
		homeBonusGoals: status === "walkover_home" ? winner : 0,
		awayBonusGoals: status === "walkover_away" ? winner : 0,
	};
}

/**
 * Aplica el cambio de estado a W.O. sobre el estado local de captura: fija el
 * marcador y los goles de equipo de inmediato (§ applyWalkoverDefaults), sin
 * tocar la asistencia/tarjetas ya capturadas. La UI (MatchResolutionScreen)
 * es quien decide qué lista queda habilitada — solo la del equipo que se
 * presentó — y bloquea la captura de goles por jugador en ambos equipos.
 */
export function applyWalkoverStatusChange(
	prev: ResolutionState,
	status: WalkoverStatus,
): ResolutionState {
	const defaults = applyWalkoverDefaults(status);
	return { ...prev, status, ...defaults };
}
