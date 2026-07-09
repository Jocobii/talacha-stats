"use client";

import { OnboardingWizard } from "@/features/onboarding-wizard";
import type {
	OnboardingStep,
	OrgIdentityView,
	CreatedVenueView,
	CreatedLeagueView,
} from "@/features/onboarding-wizard";

type Props = {
	userFirstName: string;
	initialOrg: OrgIdentityView | null;
	initialVenue: CreatedVenueView | null;
	initialLeague: CreatedLeagueView | null;
	initialStep: OnboardingStep;
};

export default function OnboardingClient(props: Props) {
	return <OnboardingWizard {...props} />;
}
