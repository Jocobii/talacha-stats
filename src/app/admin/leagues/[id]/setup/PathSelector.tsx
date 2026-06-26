"use client";

/**
 * app/admin/leagues/[id]/setup/PathSelector.tsx
 * Orquestador — entra directo al wizard de configuración (sin pantalla de elección).
 */

import { useOnboardingWizard } from "@/features/league-onboarding/model/useOnboardingWizard";
import { OnboardingWizard } from "@/features/league-onboarding/ui/OnboardingWizard";
import type { League } from "@/features/league-onboarding/types";

type Props = {
	league: League;
};

export function PathSelector({ league }: Props) {
	const { wizardStep, createdTeams, handleTeamsReady, handlePlayersReady, goToTeams } =
		useOnboardingWizard();

	return (
		<OnboardingWizard
			league={league}
			step={wizardStep}
			createdTeams={createdTeams}
			onTeamsReady={handleTeamsReady}
			onPlayersReady={handlePlayersReady}
			onBack={goToTeams}
		/>
	);
}
