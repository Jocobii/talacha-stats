/**
 * entities/suspension/index.ts
 * Exportaciones públicas — SOLO model.ts (client-safe). queries.ts importa
 * @/db y es SOLO server — se importa por ruta directa:
 * `@/entities/suspension/queries` (mismo patrón que league-config).
 */
export {
	CreateManualSuspensionSchema,
	EscalateSuspensionSchema,
	SUSPENSION_DURATION_TYPES,
	SUSPENSION_DURATION_UNITS,
	SUSPENSION_REASONS,
	SUSPENSION_STATUSES,
	type CreateManualSuspensionInput,
	type DisciplinePlayerSearchResult,
	type EscalateSuspensionInput,
	type GlobalSuspensionListItemDto,
	type NewSuspension,
	type Suspension,
	type SuspensionDto,
	type SuspensionDurationType,
	type SuspensionDurationUnit,
	type SuspensionLeagueOption,
	type SuspensionListItemDto,
	type SuspensionReason,
	type SuspensionRosterPlayer,
	type SuspensionStatus,
} from "./model";
export { isSuspensionActive } from "./lib/is-suspension-active";
