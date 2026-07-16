/**
 * entities/organization-config/index.ts
 * Exportaciones públicas — SOLO model.ts (client-safe). queries.ts importa
 * @/db y es SOLO server — se importa por ruta directa:
 * `@/entities/organization-config/queries` (mismo patrón que league-config).
 */
export {
	UpdateOrganizationConfigSchema,
	type NewOrganizationConfig,
	type OrganizationConfig,
	type OrganizationConfigDto,
	type UpdateOrganizationConfigInput,
} from "./model";
