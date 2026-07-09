import { redirect } from "next/navigation";
import { getSessionUser, redirectToLogin } from "@/shared/lib/auth";
import { getArranqueState } from "@/entities/organization";
import { listVenuesByOrganization } from "@/entities/venue";
import { mapVenueToChip, type ArranqueStep } from "@/features/arranque-onboarding";
import ArranqueClient from "./ArranqueClient";

export default async function ArranquePage() {
	const user = await getSessionUser();
	if (!user) redirectToLogin();
	if (!user.organizationId) redirect("/onboarding");

	const state = await getArranqueState(user.organizationId);
	if (state.isComplete) redirect("/admin");

	// Reanudación: si ya hay canchas creadas, no se pierden — se bajan como
	// initialData y el wizard abre directo en el paso de liga.
	const initialVenues = state.hasVenue
		? (await listVenuesByOrganization(user.organizationId)).map(mapVenueToChip)
		: [];
	const initialStep: ArranqueStep = state.hasVenue ? 1 : 0;

	return (
		<div className="min-h-screen bg-pitch px-4 py-10">
			<ArranqueClient
				organizationId={user.organizationId}
				initialVenues={initialVenues}
				initialStep={initialStep}
			/>
		</div>
	);
}
