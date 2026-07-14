/**
 * entities/suspension/index.ts
 * Exportaciones públicas — SOLO model.ts (client-safe). queries.ts importa
 * @/db y es SOLO server — se importa por ruta directa:
 * `@/entities/suspension/queries` (mismo patrón que league-config).
 */
export {
	EscalateSuspensionSchema,
	SUSPENSION_DURATION_TYPES,
	SUSPENSION_DURATION_UNITS,
	SUSPENSION_REASONS,
	SUSPENSION_STATUSES,
	type EscalateSuspensionInput,
	type NewSuspension,
	type Suspension,
	type SuspensionDto,
	type SuspensionDurationType,
	type SuspensionDurationUnit,
	type SuspensionReason,
	type SuspensionStatus,
} from "./model";
export { isSuspensionActive } from "./lib/is-suspension-active";
