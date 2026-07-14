/**
 * entities/league-config/index.ts
 * Exportaciones públicas — SOLO model.ts (client-safe: tipos, Zod, constantes).
 *
 * queries.ts importa @/db (pg) y es SOLO server — no se re-exporta aquí para
 * no arrastrar `pg` al bundle del navegador (mismo patrón que
 * tournament-skin/activations.ts). Server Components, API routes y features
 * server-only lo importan por ruta directa: `@/entities/league-config/queries`.
 */
export {
	BLUE_CARD_MEANINGS,
	DEFAULT_TIEBREAKERS,
	TIEBREAKER_CRITERIA,
	USER_TIEBREAKER_CRITERIA,
	UpdateLeagueConfigSchema,
	type BlueCardMeaning,
	type LeagueConfig,
	type LeagueConfigDto,
	type NewLeagueConfig,
	type TiebreakerCriterion,
	type UpdateLeagueConfigInput,
	type UserTiebreakerCriterion,
} from "./model";
