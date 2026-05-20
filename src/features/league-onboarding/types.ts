/**
 * features/league-onboarding/types.ts
 * Tipos compartidos de la feature. No duplicar en subcomponentes.
 */

export type League = {
	id: string;
	name: string;
	season: string;
	dayOfWeek: string;
};

export type DraftTeam = { name: string; color: string };
export type CreatedTeam = { id: string; name: string; color: string | null };

export type Screen = "choosing" | "wizard";
export type WizardStep = 0 | 1 | 2; // Equipos | Jugadores | Listo
