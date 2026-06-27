/**
 * features/league-selection/types.ts
 * Tipos compartidos de la feature. No duplicar en subcomponentes.
 */

/** Opción lista para pintar en el <select> de liga (ViewModel, §19). */
export type LeagueOption = {
	id: string;
	label: string;
};
