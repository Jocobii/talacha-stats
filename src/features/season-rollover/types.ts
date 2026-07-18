/**
 * features/season-rollover/types.ts
 * Tipos compartidos del rollover de temporada.
 */

export type NewSeasonInput = {
	season: string;
};

export type CreateNextSeasonResult = {
	id: string;
	name: string;
	season: string;
	copied: {
		teams: number;
		players: number;
		zones: number;
		venues: number;
		hasSchedulingConfig: boolean;
	};
};
