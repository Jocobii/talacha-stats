/**
 * features/player-credential/urls.ts
 * URLs de la feature — separado de constants.ts (archivo obsoleto pendiente
 * de borrar, ver ese archivo) para no tocarlo.
 */
export const ISSUE_CREDENTIAL_URL = "/api/player-credentials";
export const ORGANIZATION_CREDENTIAL_CONFIG_URL = (organizationId: string): string =>
	`/api/organizations/${organizationId}/credential-config`;
