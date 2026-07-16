/**
 * features/organization-profile/constants.ts
 * Magic values del tab General del hub de organización (docs/ORG-PROFILE-HUB.md).
 */

export const organizationUrl = (organizationId: string): string =>
	`/api/organizations/${organizationId}`;

export const checkOrgSlugUrl = (slug: string): string =>
	`/api/organizations/check-slug?slug=${encodeURIComponent(slug)}`;

/** Debounce del chequeo de disponibilidad de slug — mismo valor que onboarding-wizard. */
export const SLUG_CHECK_DEBOUNCE_MS = 450;
