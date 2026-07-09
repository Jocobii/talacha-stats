"use client";

/**
 * features/arranque-onboarding/ui/ArranqueWizard.tsx
 * Orquestador del wizard de Arranque: decide qué paso pinta. Estado dueño en
 * useArranqueWizard; los pasos son componentes tontos (ViewModels + callbacks).
 */

import { PageHeader } from "@/shared/ui/PageHeader";
import { Card } from "@/shared/ui/Card";
import { Stepper } from "@/shared/ui/Stepper";
import { StepVenue } from "./StepVenue";
import { StepLeague } from "./StepLeague";
import { StepSchedule } from "./StepSchedule";
import { StepReady } from "./StepReady";
import { ARRANQUE_STEPS } from "../constants";
import { useArranqueWizard } from "../model/useArranqueWizard";
import type { CreatedVenueView, ArranqueStep } from "../types";

type Props = {
	organizationId: string;
	initialVenues?: CreatedVenueView[];
	initialStep?: ArranqueStep;
};

export function ArranqueWizard({ organizationId, initialVenues, initialStep }: Props) {
	const wizard = useArranqueWizard(initialVenues, initialStep);

	return (
		<div className="flex flex-col gap-8 max-w-[720px] mx-auto">
			<PageHeader title="Arranca tu operación" subtitle="Cancha, liga y horario en tres pasos" />

			<Card className="p-6">
				<Stepper steps={ARRANQUE_STEPS} current={wizard.step} />
			</Card>

			{wizard.step === 0 && (
				<StepVenue
					organizationId={organizationId}
					createdVenues={wizard.createdVenues}
					onVenueCreated={wizard.addVenue}
					onContinue={wizard.goToLeague}
				/>
			)}
			{wizard.step === 1 && <StepLeague onLeagueReady={wizard.handleLeagueReady} />}
			{wizard.step === 2 && wizard.createdLeague && (
				<StepSchedule
					league={wizard.createdLeague}
					venues={wizard.createdVenues}
					onScheduleReady={wizard.handleScheduleReady}
				/>
			)}
			{wizard.step === 3 && wizard.createdLeague && <StepReady league={wizard.createdLeague} />}
		</div>
	);
}
