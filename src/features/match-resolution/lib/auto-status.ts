/**
 * features/match-resolution/lib/auto-status.ts
 * Transiciones automáticas de estatus derivadas de la captura del marcador.
 */
import type { ResolutionState } from "../types";

/**
 * Si el partido está "scheduled" y ya se capturaron ambos marcadores
 * globales, el estatus pasa automáticamente a "played" — ya no hace falta
 * elegirlo a mano en el dropdown de estatus.
 */
export function autoMarkPlayedOnScore(state: ResolutionState): ResolutionState {
	if (state.status !== "scheduled") return state;
	if (state.homeScore === null || state.awayScore === null) return state;
	return { ...state, status: "played" };
}
