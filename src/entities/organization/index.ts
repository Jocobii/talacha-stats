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
	getLeagueZones,
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
	PublicZone,
} from "./queries";

// Tema visual (docs/ORG-THEMING.md)
export { findOrgThemeBySlug, findOrgThemeByOrgId, upsertOrgTheme } from "./theme-queries";
