/**
 * entities/organization-scheduling-config/index.ts
 * Exportaciones públicas — SOLO model.ts (client-safe). queries.ts importa
 * @/db y es SOLO server — se importa por ruta directa:
 * `@/entities/organization-scheduling-config/queries` (mismo patrón que organization-config).
 */
export {
	UpdateOrganizationSchedulingConfigSchema,
	type NewOrganizationSchedulingConfig,
	type OrganizationSchedulingConfig,
	type OrganizationSchedulingConfigDto,
	type UpdateOrganizationSchedulingConfigInput,
} from "./model";
export { ORGANIZATION_SCHEDULING_CONFIG_DEFAULTS } from "./defaults";
