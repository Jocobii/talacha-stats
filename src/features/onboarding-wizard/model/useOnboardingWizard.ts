"use client";

/**
 * features/onboarding-wizard/model/useOnboardingWizard.ts
 * Estado del wizard unificado: Identidad → Operación → Horario → Listo.
 * Persistencia progresiva: cada paso ya guardó en DB antes de avanzar (ver
 * los hooks de mutación); este hook solo decide qué paso se pinta y qué
 * ViewModels arrastra el siguiente.
 *
 * Reanudación: page.tsx baja initialOrg/initialVenue/initialLeague/initialStep
 * calculados en el server (a partir de getArranqueState) para no perder
 * trabajo ya guardado si el usuario abandonó a medias.
 */

import { useState } from "react";
import type {
	OnboardingStep,
	OrgIdentityView,
	CreatedVenueView,
	CreatedLeagueView,
	DraftIdentity,
	ScheduleDraft,
} from "../types";

type Params = {
	initialOrg: OrgIdentityView | null;
	initialVenue: CreatedVenueView | null;
	initialLeague: CreatedLeagueView | null;
	initialStep: OnboardingStep;
};

const EMPTY_DRAFT: DraftIdentity = {
	name: "",
	slug: "",
	logoUrl: "",
	style: { presetId: null, fontId: "brand" },
};

export function useOnboardingWizard({
	initialOrg,
	initialVenue,
	initialLeague,
	initialStep,
}: Params) {
	const [step, setStep] = useState<OnboardingStep>(initialStep);
	const [org, setOrg] = useState<OrgIdentityView | null>(initialOrg);
	const [venue, setVenue] = useState<CreatedVenueView | null>(initialVenue);
	const [league, setLeague] = useState<CreatedLeagueView | null>(initialLeague);
	const [isComplete, setIsComplete] = useState(false);
	// Snapshot en vivo del paso Identidad, para que el aside de preview
	// reaccione tecla por tecla antes de que la org exista de verdad.
	const [draftIdentity, setDraftIdentity] = useState<DraftIdentity>(EMPTY_DRAFT);
	// Horario confirmado en el paso 3 — lo necesita la pantalla final.
	const [schedule, setSchedule] = useState<ScheduleDraft | null>(null);

	function handleIdentityReady(identity: OrgIdentityView): void {
		setOrg(identity);
		setStep(1);
	}

	function handleOperationReady(
		createdVenue: CreatedVenueView,
		createdLeague: CreatedLeagueView,
	): void {
		setVenue(createdVenue);
		setLeague(createdLeague);
		setStep(2);
	}

	function handleScheduleReady(confirmedSchedule: ScheduleDraft): void {
		setSchedule(confirmedSchedule);
		setIsComplete(true);
	}

	function goBackTo(target: OnboardingStep): void {
		setStep(target);
	}

	return {
		step,
		org,
		venue,
		league,
		isComplete,
		draftIdentity,
		setDraftIdentity,
		schedule,
		handleIdentityReady,
		handleOperationReady,
		handleScheduleReady,
		goBackTo,
	};
}
