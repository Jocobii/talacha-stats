/**
 * entities/player-credential/index.ts
 * Exportaciones públicas — SOLO model.ts (client-safe). Las queries de
 * lectura/escritura viven en features (canPlayInLeague, issuePlayerCredential)
 * y se importan por ruta directa, mismo patrón que organization-config.
 */
export {
	PlayerCredentialScopeSchema,
	PlayerCredentialStatusSchema,
	PlayerCredentialSchema,
	CreatePlayerCredentialSchema,
	CredentialDisplayStatusSchema,
	CredentialScopeOptionsSchema,
	CredentialStatusResponseSchema,
	LeagueMemberCredentialStatusSchema,
	LeagueCredentialStatusesResponseSchema,
	PlayerCredentialWithContextSchema,
	PlayerCredentialsListResponseSchema,
	type PlayerCredentialScope,
	type PlayerCredentialStatus,
	type PlayerCredential,
	type CreatePlayerCredential,
	type CredentialDisplayStatus,
	type CredentialScopeOptions,
	type CredentialStatusResponse,
	type LeagueMemberCredentialStatus,
	type LeagueCredentialStatusesResponse,
	type PlayerCredentialWithContext,
	type PlayerCredentialsListResponse,
} from "./model";
export { CREDENTIAL_DISPLAY_STATUSES } from "./lib/credential-status";
