"use client";

/**
 * features/arranque-onboarding/model/useArranqueWizard.ts
 * Estado del wizard de Arranque: Cancha → Liga → Horario → Listo.
 *
 * Reanudación (docs/ONBOARDING-PARTE-2.md §6): si el usuario ya tiene canchas
 * creadas, `page.tsx` las baja como `initialVenues` para no perderlas y abre
 * el wizard en el paso correcto con `initialStep`.
 */

import { useState } from "react";
import type { ArranqueStep, CreatedLeagueView, CreatedVenueView } from "../types";

export type UseArranqueWizardReturn = {
	step: ArranqueStep;
	createdVenues: CreatedVenueView[];
	createdLeague: CreatedLeagueView | null;
	addVenue: (venue: CreatedVenueView) => void;
	goToLeague: () => void;
	handleLeagueReady: (league: CreatedLeagueView) => void;
	handleScheduleReady: () => void;
	goBackTo: (step: ArranqueStep) => void;
};

export function useArranqueWizard(
	initialVenues: CreatedVenueView[] = [],
	initialStep: ArranqueStep = 0,
): UseArranqueWizardReturn {
	const [step, setStep] = useState<ArranqueStep>(initialStep);
	const [createdVenues, setCreatedVenues] = useState<CreatedVenueView[]>(initialVenues);
	const [createdLeague, setCreatedLeague] = useState<CreatedLeagueView | null>(null);

	function addVenue(venue: CreatedVenueView): void {
		setCreatedVenues((prev) => [...prev, venue]);
	}

	function goToLeague(): void {
		setStep(1);
	}

	function handleLeagueReady(league: CreatedLeagueView): void {
		setCreatedLeague(league);
		setStep(2);
	}

	function handleScheduleReady(): void {
		setStep(3);
	}

	function goBackTo(target: ArranqueStep): void {
		setStep(target);
	}

	return {
		step,
		createdVenues,
		createdLeague,
		addVenue,
		goToLeague,
		handleLeagueReady,
		handleScheduleReady,
		goBackTo,
	};
}
