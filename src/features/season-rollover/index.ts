/**
 * features/season-rollover/index.ts
 * Exportaciones públicas. App/ y otras capas solo importan desde aquí.
 *
 * NOTA: las funciones de lib/ (createNextSeason, cloneLeagueSettings,
 * cloneTeamRoster) importan @/db y son SOLO server — no se re-exportan aquí
 * para que los Client Components que importen este barrel no arrastren `pg`
 * al bundle del navegador (mismo patrón que features/team-management/actions,
 * ver comentario en su index.ts). Los API routes las importan por ruta
 * directa: `@/features/season-rollover/lib/create-next-season`, etc.
 */

export type { NewSeasonInput, CreateNextSeasonResult } from "./types";
