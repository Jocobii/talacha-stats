export { CreateOrganizationSchema, UpdateOrganizationSchema, generateSlug } from "./model";

export type { CreateOrganizationInput, UpdateOrganizationInput } from "./model";

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
	getPublicMatchdays,
	// Público — hub
	getLeagueSnapshot,
	getOrgHubStats,
	getLeaguesShowcase,
	// Verificaciones
	listPendingVerifications,
	approveOrganization,
	// Escritura
	createOrganization,
	updateOrganization,
	deleteOrganization,
	setUserOrganization,
} from "./queries";

export type {
	LeagueSnapshot,
	OrgHubStats,
	LeagueShowcaseItem,
	PendingVerification,
	PublicMatchday,
	PublicMatchInfo,
} from "./queries";
