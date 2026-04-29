export {
	CreateOrganizationSchema,
	UpdateOrganizationSchema,
	generateSlug,
} from "./model";

export type {
	CreateOrganizationInput,
	UpdateOrganizationInput,
} from "./model";

export {
	// Admin
	getOrganizationById,
	getOrganizationBySlug,
	listOrganizations,
	getOrganizationByUserId,
	getOrganizationWithDetails,
	getUsersByOrganization,
	getLeaguesByOrganization,
	// Público — directorio
	listOrganizationsPublic,
	getPublicOrganization,
	getPublicLeague,
	getLatestStandings,
	getLatestTopScorers,
	getStandingsHistory,
	// Público — hub
	getLeagueSnapshot,
	getOrgHubStats,
	// Escritura
	createOrganization,
	updateOrganization,
	deleteOrganization,
	setUserOrganization,
} from "./queries";

export type { LeagueSnapshot, OrgHubStats } from "./queries";
