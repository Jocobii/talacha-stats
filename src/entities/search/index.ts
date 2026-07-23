/**
 * entities/search/index.ts
 * Exportaciones públicas — SOLO model.ts (client-safe). queries.ts importa
 * @/db y es SOLO server — se importa por ruta directa:
 * `@/entities/search/queries` (mismo patrón que entities/suspension).
 */
export type {
	SearchHit,
	SearchHitKind,
	TeamSearchHit,
	LeagueSearchHit,
	PlayerSearchHit,
	SuspensionSearchHit,
	VenueSearchHit,
} from "./model";
