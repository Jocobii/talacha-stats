import { getSessionUser } from "@/shared/lib/auth";
import { listOrganizations, getOrganizationByUserId } from "@/entities/organization";
import NewLeagueForm from "./NewLeagueForm";

export default async function NewLeaguePage() {
	const session = await getSessionUser();

	// owner ve todas las orgs para escoger; organizer solo la suya
	let organizations: { id: string; name: string; city: string }[] = [];

	if (session?.role === "owner") {
		organizations = await listOrganizations();
	} else if (session?.organizationId) {
		const org = await getOrganizationByUserId(session.id);
		if (org) organizations = [org];
	}

	return (
		<NewLeagueForm
			organizations={organizations}
			defaultOrganizationId={session?.organizationId ?? undefined}
		/>
	);
}
