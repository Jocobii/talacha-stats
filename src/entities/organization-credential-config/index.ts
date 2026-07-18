/**
 * entities/organization-credential-config/index.ts
 * Exportaciones públicas — SOLO model.ts (client-safe). queries.ts importa
 * @/db y es SOLO server — se importa por ruta directa
 * `@/entities/organization-credential-config/queries` (mismo patrón que
 * organization-config).
 */
export {
	UpdateOrganizationCredentialConfigSchema,
	type NewOrganizationCredentialConfig,
	type OrganizationCredentialConfig,
	type OrganizationCredentialConfigDto,
	type UpdateOrganizationCredentialConfigInput,
} from "./model";
