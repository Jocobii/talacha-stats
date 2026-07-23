export {
	CreateOrganizationSchema,
	UpdateOrganizationSchema,
	SlugAvailabilitySchema,
	generateSlug,
} from "./model";

export type { CreateOrganizationInput, UpdateOrganizationInput, SlugAvailability } from "./model";
export type { Organization } from "@/db/schema";

export {
	// Admin
	getOrganizationById,
	getOrganizationBySlug,
	listOrganizations,
	getOrganizationByUserId,
	getOrganizationWithDetails,
	getUsersByOrganization,
	getLeaguesByOrganization,
	listAllLeaguesWithTeamCount,
	// Público — directorio
	listOrganizationsPublic,
	listOrganizationsPublicPaginated,
	getPublicOrganization,
	getPublicLeague,
	getLatestStandings,
	searchTopScorers,
	getPublicMatchdays,
	getLeagueZones,
	// Público — hub
	getLeagueSnapshot,
	getOrgHubStats,
	getLeaguesShowcase,
	getOrgUpcomingMatches,
	getOrgRecentResults,
	getOrgTopScorers,
	getOrgMatchesToday,
	searchOrgTeams,
	// Verificaciones
	listPendingVerifications,
	approveOrganization,
	// Onboarding Parte 2 (Arranque)
	getArranqueState,
	// Escritura
	createOrganization,
	updateOrganization,
	deleteOrganization,
	setUserOrganization,
} from "./queries";

export { deriveArranqueState } from "./lib/derive-arranque-state";
export type { ArranqueState, ArranqueCounts } from "./lib/derive-arranque-state";

export type {
	LeagueSnapshot,
	OrgHubStats,
	OrgFeedMatch,
	LeagueShowcaseItem,
	PendingVerification,
	PublicMatchday,
	PublicMatchInfo,
	PublicZone,
	LeagueWithTeamCount,
	TopScorerRow,
	OrgDirectoryItem,
	OrgDirectoryFilters,
	OrgDirectorySort,
	OrgTopScorer,
	OrgTeamSearchResult,
} from "./queries";

// Tema visual (docs/ORG-THEMING.md)
export { findOrgThemeBySlug, findOrgThemeByOrgId, upsertOrgTheme } from "./theme-queries";
