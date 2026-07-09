/**
 * features/arranque-onboarding/index.ts
 * Exportaciones públicas de la feature.
 * app/ y otras capas solo importan desde aquí, nunca directamente desde subcarpetas.
 */

export { ArranqueWizard } from "./ui/ArranqueWizard";
export { mapVenueToChip } from "./lib/map-venue-to-chip";

export type { ArranqueStep, CreatedVenueView, CreatedLeagueView } from "./types";
