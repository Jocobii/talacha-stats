/**
 * features/onboarding-wizard/index.ts
 * Exportaciones públicas de la feature.
 * app/ y otras capas solo importan desde aquí, nunca directamente desde subcarpetas.
 */

export { OnboardingWizard } from "./ui/OnboardingWizard";
export { mapVenueToChip } from "./lib/map-venue-to-chip";
export { mapLeagueToSummary } from "./lib/map-league-to-summary";
export { mapOrganizationToIdentity } from "./lib/map-organization-to-identity";

export type { OnboardingStep, OrgIdentityView, CreatedVenueView, CreatedLeagueView } from "./types";
