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
	LeagueShowcaseItem,
	PendingVerification,
	PublicMatchday,
	PublicMatchInfo,
	PublicZone,
	LeagueWithTeamCount,
} from "./queries";

// Tema visual (docs/ORG-THEMING.md)
export { findOrgThemeBySlug, findOrgThemeByOrgId, upsertOrgTheme } from "./theme-queries";
