// features/scheduling/index.ts
// Exportaciones públicas del módulo de sorteo.
// Solo re-exporta lo que otras capas necesitan ver.

export type { GeneratedSchedule, TeamDeficit, SlotConflict } from "./types";
export { SCHEDULING_PHASES, MATCHDAY_STATUSES, REGULAR_FORMATS } from "./constants";
