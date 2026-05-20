/**
 * features/league-onboarding/index.ts
 * Exportaciones públicas de la feature.
 * app/ y otras capas solo importan desde aquí, nunca directamente desde subcarpetas.
 */

export { useOnboardingWizard } from "./model/useOnboardingWizard";
export { useStepTeams } from "./model/useStepTeams";

export { LeagueChoicePage } from "./ui/LeagueChoicePage";
export { OnboardingWizard } from "./ui/OnboardingWizard";
export { PlayerPreviewCard } from "./ui/PlayerPreviewCard";
export { StepTeams } from "./ui/StepTeams";
export { StepPlayers } from "./ui/StepPlayers";
export { StepDone } from "./ui/StepDone";
export { WizardFooter, MiniStat } from "./ui/WizardShared";

export type { League, DraftTeam, CreatedTeam, Screen, WizardStep } from "./types";
export type { UseOnboardingWizardReturn } from "./model/useOnboardingWizard";
export type { UseStepTeamsReturn } from "./model/useStepTeams";
