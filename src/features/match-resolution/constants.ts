/**
 * features/match-resolution/constants.ts
 * Constantes del módulo de Resolución de Partidos.
 */
import type { ResolutionStatus } from "@/db/schema";

export const AUTOSAVE_DEBOUNCE_MS = 1000;

export const WALKOVER_DEFAULT_SCORE = { winner: 3, loser: 0 } as const;

export const MAX_GOALS_PER_PLAYER = 20;
export const MAX_CARDS_PER_PLAYER = 3;

export const KEYBOARD_SHORTCUTS = {
	SAVE: "Mod+s",
	SAVE_NEXT: "Mod+Enter",
	CANCEL: "Escape",
	ADD_PLAYER_HOME: "Mod+Shift+h",
	ADD_PLAYER_AWAY: "Mod+Shift+a",
} as const;

export const STAT_COLUMNS = ["goals", "yellowCards", "blueCards", "redCards", "assists"] as const;
export type StatColumn = (typeof STAT_COLUMNS)[number];

export const STATUS_LABELS: Record<ResolutionStatus, string> = {
	scheduled: "Pendiente",
	played: "Jugado",
	suspended: "Suspendido",
	walkover_home: "W.O. Local",
	walkover_away: "W.O. Visitante",
	postponed: "Pospuesto",
};

export const WALKOVER_STATUSES = ["walkover_home", "walkover_away"] as const;
export const CLEAR_STATS_STATUSES = ["suspended", "postponed", ...WALKOVER_STATUSES] as const;
