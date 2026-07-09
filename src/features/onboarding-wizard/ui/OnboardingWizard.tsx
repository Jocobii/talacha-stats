"use client";

/**
 * features/onboarding-wizard/ui/OnboardingWizard.tsx
 * Orquestador del onboarding unificado: Identidad → Operación → Horario →
 * Listo, en una sola pantalla continua (reemplaza los dos flujos separados
 * /onboarding + /onboarding/arranque). Estado dueño en useOnboardingWizard;
 * los pasos son componentes tontos.
 */

import { PageHeader } from "@/shared/ui/PageHeader";
import { Card } from "@/shared/ui/Card";
import { Stepper } from "@/shared/ui/Stepper";
import { StepIdentity } from "./StepIdentity";
import { StepOperation } from "./StepOperation";
import { StepSchedule } from "./StepSchedule";
import { StepFinale } from "./StepFinale";
import { OnboardingPreviewAside } from "./OnboardingPreviewAside";
import { ONBOARDING_STEPS } from "../constants";
import { useOnboardingWizard } from "../model/useOnboardingWizard";
import type {
	OrgIdentityView,
	CreatedVenueView,
	CreatedLeagueView,
	OnboardingStep,
} from "../types";

type Props = {
	userFirstName: string;
	initialOrg: OrgIdentityView | null;
	initialVenue: CreatedVenueView | null;
	initialLeague: CreatedLeagueView | null;
	initialStep: OnboardingStep;
};

export function OnboardingWizard({
	userFirstName,
	initialOrg,
	initialVenue,
	initialLeague,
	initialStep,
}: Props) {
	const wizard = useOnboardingWizard({ initialOrg, initialVenue, initialLeague, initialStep });

	if (wizard.isComplete && wizard.org && wizard.venue && wizard.league && wizard.schedule) {
		return (
			<StepFinale
				org={wizard.org}
				venue={wizard.venue}
				league={wizard.league}
				schedule={wizard.schedule}
				logoUrl={wizard.draftIdentity.logoUrl}
				style={wizard.draftIdentity.style}
			/>
		);
	}

	return (
		<div className="mx-auto flex max-w-[1200px] flex-col gap-8">
			<PageHeader title={`Bienvenido, ${userFirstName}`} subtitle="Configura tu liga en 3 pasos" />

			{/* El preview arranca alineado con la tarjeta del form, no con el
			    título de arriba — por eso el PageHeader vive fuera de este grid. */}
			<div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_460px]">
				<div className="flex flex-col gap-8 min-w-0">
					<Card className="p-6">
						<Stepper steps={ONBOARDING_STEPS} current={wizard.step} />
					</Card>

					{wizard.step === 0 && (
						<StepIdentity
							onIdentityReady={wizard.handleIdentityReady}
							onDraftChange={wizard.setDraftIdentity}
						/>
					)}

					{wizard.step === 1 && wizard.org && (
						<StepOperation
							organizationId={wizard.org.id}
							initialVenue={wizard.venue}
							onOperationReady={wizard.handleOperationReady}
						/>
					)}

					{wizard.step === 2 && wizard.league && wizard.venue && (
						<StepSchedule
							league={wizard.league}
							venue={wizard.venue}
							onScheduleReady={wizard.handleScheduleReady}
						/>
					)}
				</div>

				<OnboardingPreviewAside
					name={wizard.org?.name ?? wizard.draftIdentity.name}
					slug={wizard.org?.slug ?? wizard.draftIdentity.slug}
					logoUrl={wizard.draftIdentity.logoUrl}
					style={wizard.draftIdentity.style}
					venue={wizard.venue}
					league={wizard.league}
				/>
			</div>
		</div>
	);
}
