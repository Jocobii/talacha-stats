"use client";

/**
 * features/league-onboarding/model/useOnboardingWizard.ts
 * Estado del wizard de configuración: Equipos → Jugadores → Listo.
 *
 * La liga ya viene creada (modal de alta). Aquí solo se avanza por los pasos.
 */

import { useState } from "react";
import type { CreatedTeam, WizardStep } from "../types";

export type UseOnboardingWizardReturn = {
	wizardStep: WizardStep;
	createdTeams: CreatedTeam[];
	handleTeamsReady: (teams: CreatedTeam[]) => void;
	handlePlayersReady: () => void;
	goToTeams: () => void;
};

export function useOnboardingWizard(): UseOnboardingWizardReturn {
	const [wizardStep, setWizardStep] = useState<WizardStep>(0);
	const [createdTeams, setCreatedTeams] = useState<CreatedTeam[]>([]);

	function handleTeamsReady(teams: CreatedTeam[]): void {
		setCreatedTeams(teams);
		setWizardStep(1);
	}

	function handlePlayersReady(): void {
		setWizardStep(2);
	}

	function goToTeams(): void {
		setWizardStep(0);
	}

	return { wizardStep, createdTeams, handleTeamsReady, handlePlayersReady, goToTeams };
}
