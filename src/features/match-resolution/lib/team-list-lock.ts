/**
 * features/match-resolution/lib/team-list-lock.ts
 * Reglas de bloqueo de la lista de un equipo según el status del partido.
 */
import type { TeamSide } from "../types";
import { CLEAR_STATS_STATUSES } from "../constants";

/**
 * Suspendido/Pospuesto bloquean ambas listas (no hubo partido).
 * W.O. bloquea SOLO la lista del equipo que no se presentó — la del equipo
 * que sí llegó queda habilitada para tomar asistencia (§ isTeamGoalsLocked
 * bloquea aparte la captura de goles por jugador en ambos equipos).
 */
export function isTeamListDisabled(status: string, side: TeamSide): boolean {
	if ((CLEAR_STATS_STATUSES as readonly string[]).includes(status)) return true;
	if (status === "walkover_home") return side === "away"; // el visitante no se presentó
	if (status === "walkover_away") return side === "home"; // el local no se presentó
	return false;
}
