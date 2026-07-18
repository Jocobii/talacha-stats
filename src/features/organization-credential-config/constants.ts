/**
 * features/organization-credential-config/constants.ts
 * Magic values centralizados — mismo patrón que organization-rules/constants.ts.
 */
export const ORGANIZATION_CREDENTIAL_CONFIG_URL = (organizationId: string): string =>
	`/api/organizations/${organizationId}/credential-config`;
