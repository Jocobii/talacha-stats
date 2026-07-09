"use client";

import { ArranqueWizard } from "@/features/arranque-onboarding";
import type { ArranqueStep, CreatedVenueView } from "@/features/arranque-onboarding";

type Props = {
	organizationId: string;
	initialVenues: CreatedVenueView[];
	initialStep: ArranqueStep;
};

export default function ArranqueClient({ organizationId, initialVenues, initialStep }: Props) {
	return (
		<ArranqueWizard
			organizationId={organizationId}
			initialVenues={initialVenues}
			initialStep={initialStep}
		/>
	);
}
