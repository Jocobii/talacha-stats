"use client";

/**
 * features/league-onboarding/model/useOnboardingWizard.ts
 * Estado y navegación del flujo completo: elección de camino + wizard 3 pasos.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EXCEL_IMPORT_URL } from "../constants";
import type { League, CreatedTeam, Screen, WizardStep } from "../types";

export type UseOnboardingWizardReturn = {
	screen: Screen;
	wizardStep: WizardStep;
	createdTeams: CreatedTeam[];
	goToWizard: () => void;
	goToExcel: () => void;
	handleTeamsReady: (teams: CreatedTeam[]) => void;
	handlePlayersReady: () => void;
	handleBack: () => void;
};

export function useOnboardingWizard(
	league: League,
	initialPath?: "choosing" | "v2",
): UseOnboardingWizardReturn {
	const [screen, setScreen] = useState<Screen>(initialPath === "v2" ? "wizard" : "choosing");
	const [wizardStep, setWizardStep] = useState<WizardStep>(0);
	const [createdTeams, setCreatedTeams] = useState<CreatedTeam[]>([]);
	const router = useRouter();

	function goToWizard(): void {
		setScreen("wizard");
	}

	function goToExcel(): void {
		router.push(EXCEL_IMPORT_URL(league.id));
	}

	function handleTeamsReady(teams: CreatedTeam[]): void {
		setCreatedTeams(teams);
		setWizardStep(1);
	}

	function handlePlayersReady(): void {
		setWizardStep(2);
	}

	function handleBack(): void {
		setScreen("choosing");
	}

	return {
		screen,
		wizardStep,
		createdTeams,
		goToWizard,
		goToExcel,
		handleTeamsReady,
		handlePlayersReady,
		handleBack,
	};
}
