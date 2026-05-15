"use client";

/**
 * app/admin/leagues/[id]/setup/PathSelector.tsx
 * Orquestador — delega estado a useOnboardingWizard y renderiza la pantalla correcta.
 */

import { useOnboardingWizard } from "@/features/league-onboarding/model/useOnboardingWizard";
import { LeagueChoicePage } from "@/features/league-onboarding/ui/LeagueChoicePage";
import { OnboardingWizard } from "@/features/league-onboarding/ui/OnboardingWizard";
import type { League } from "@/features/league-onboarding/types";

type Props = {
	league: League;
	initialPath?: "choosing" | "v2";
};

export function PathSelector({ league, initialPath }: Props) {
	const {
		screen,
		wizardStep,
		createdTeams,
		goToWizard,
		goToExcel,
		handleTeamsReady,
		handlePlayersReady,
		handleBack,
	} = useOnboardingWizard(league, initialPath);

	if (screen === "choosing") {
		return <LeagueChoicePage league={league} onPro={goToWizard} onExcel={goToExcel} />;
	}

	return (
		<OnboardingWizard
			league={league}
			step={wizardStep}
			createdTeams={createdTeams}
			onTeamsReady={handleTeamsReady}
			onPlayersReady={handlePlayersReady}
			onBack={handleBack}
		/>
	);
}
