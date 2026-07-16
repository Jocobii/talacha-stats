/**
 * entities/match-player-stat/index.ts
 * Exportaciones públicas — SOLO model.ts (client-safe). queries.ts importa
 * @/db y es SOLO server — se importa por ruta directa:
 * `@/entities/match-player-stat/queries` (mismo patrón que league-config,
 * organization-config, suspension).
 */
export type { MatchPlayerStat, AdHocPlayerResult } from "./model";
