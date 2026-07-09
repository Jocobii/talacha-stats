/**
 * entities/organization/lib/derive-arranque-state.ts
 *
 * Lógica pura de derivación del estado de "Onboarding Parte 2" (Arranque:
 * Cancha → Liga → Horario). Separada de queries.ts para poder testearla sin
 * importar `@/db` (Regla §20.3 — aislar la unidad, sin tocar DB en unit tests).
 *
 * No hay columna nueva en `organizations`: el estado se deriva de conteos.
 * `isComplete` = la org tiene al menos una liga con cancha asignada Y ventana
 * horaria creada (ver docs/ONBOARDING-PARTE-2.md §6).
 */

export type ArranqueState = {
	hasVenue: boolean;
	hasLeague: boolean;
	/** true si existe al menos una liga con cancha asignada + ventana horaria */
	hasScheduledLeague: boolean;
	isComplete: boolean;
};

export type ArranqueCounts = {
	venueCount: number;
	leagueCount: number;
	scheduledLeagueCount: number;
};

export function deriveArranqueState(counts: ArranqueCounts): ArranqueState {
	const hasScheduledLeague = counts.scheduledLeagueCount > 0;
	return {
		hasVenue: counts.venueCount > 0,
		hasLeague: counts.leagueCount > 0,
		hasScheduledLeague,
		isComplete: hasScheduledLeague,
	};
}
