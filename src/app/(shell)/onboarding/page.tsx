import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getSessionUser, redirectToLogin } from "@/shared/lib/auth";
import {
	getOrganizationByUserId,
	getArranqueState,
	getLeaguesByOrganization,
} from "@/entities/organization";
import { listVenuesByOrganization } from "@/entities/venue";
import {
	mapVenueToChip,
	mapLeagueToSummary,
	mapOrganizationToIdentity,
	type OnboardingStep,
	type CreatedVenueView,
	type CreatedLeagueView,
} from "@/features/onboarding-wizard";
import OnboardingClient from "./OnboardingClient";

export default async function OnboardingPage() {
	const user = await getSessionUser();
	if (!user) redirectToLogin();

	const userFirstName = user.name.split(" ")[0];

	if (!user.organizationId) {
		return (
			<Shell>
				<OnboardingClient
					userFirstName={userFirstName}
					initialOrg={null}
					initialVenue={null}
					initialLeague={null}
					initialStep={0}
				/>
			</Shell>
		);
	}

	// Ya tiene organización: si el arranque (cancha + liga + horario) ya está
	// completo, no re-onboardeamos — directo al panel.
	const arranque = await getArranqueState(user.organizationId);
	if (arranque.isComplete) redirect("/admin");

	const [org, venues, leagues] = await Promise.all([
		getOrganizationByUserId(user.id),
		arranque.hasVenue ? listVenuesByOrganization(user.organizationId) : Promise.resolve([]),
		arranque.hasLeague ? getLeaguesByOrganization(user.organizationId) : Promise.resolve([]),
	]);
	if (!org) redirect("/onboarding"); // dato inconsistente (defensivo)

	// Reanudación: si ya hay cancha/liga creadas, no se pierden — bajan como
	// initialData y el wizard abre directo en el paso correcto.
	const initialVenue: CreatedVenueView | null = venues[0] ? mapVenueToChip(venues[0]) : null;
	const initialLeague: CreatedLeagueView | null = leagues[0]
		? mapLeagueToSummary(leagues[0])
		: null;
	const initialStep: OnboardingStep = initialLeague ? 2 : 1;

	return (
		<Shell>
			<OnboardingClient
				userFirstName={userFirstName}
				initialOrg={mapOrganizationToIdentity(org)}
				initialVenue={initialVenue}
				initialLeague={initialLeague}
				initialStep={initialStep}
			/>
		</Shell>
	);
}

function Shell({ children }: { children: ReactNode }) {
	return (
		<div className="flex min-h-screen items-center justify-center bg-pitch px-4 py-10">
			<div className="w-full max-w-[1240px] space-y-8">{children}</div>
		</div>
	);
}
