/**
 * features/arranque-onboarding/types.ts
 * Tipos compartidos del wizard de Arranque. No duplicar en subcomponentes.
 */

export type ArranqueStep = 0 | 1 | 2 | 3; // Cancha | Liga | Horario | Listo

/** ViewModel de una cancha recién creada — lo mínimo que necesita la UI del wizard. */
export type CreatedVenueView = {
	id: string;
	name: string;
	color: string;
};

/** ViewModel de la liga recién creada — incluye dayOfWeek: el horario lo hereda. */
export type CreatedLeagueView = {
	id: string;
	name: string;
	dayOfWeek: string;
	season: string;
};
