// features/scheduling/constants.ts
// Magic strings, enums y límites del módulo de sorteo.

export const SCHEDULING_PHASES = ["regular", "playoff"] as const;
export type SchedulingPhase = (typeof SCHEDULING_PHASES)[number];

export const MATCHDAY_STATUSES = ["draft", "published", "in_progress", "completed"] as const;
export type MatchdayStatus = (typeof MATCHDAY_STATUSES)[number];

export const REGULAR_FORMATS = ["single", "double"] as const;
export type RegularFormat = (typeof REGULAR_FORMATS)[number];

export const CHANGE_TYPES = ["time", "venue", "team_swap", "matchday"] as const;
export type ChangeType = (typeof CHANGE_TYPES)[number];

/** Duración por defecto de un partido en minutos */
export const DEFAULT_MATCH_DURATION_MINUTES = 50;

/** Buffer entre partidos consecutivos en la misma cancha (minutos) */
export const DEFAULT_BUFFER_MINUTES = 0;

/** Máximo de jornadas regulares permitidas */
export const MAX_REGULAR_MATCHDAYS = 60;

/** Máximo de equipos soportados por el generador en MVP */
export const MAX_TEAMS = 32;
