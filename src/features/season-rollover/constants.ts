/**
 * features/season-rollover/constants.ts
 * Magic strings/valores por defecto del rollover de temporada (AGENTS.md §3.5).
 */

// Zona de playoffs por defecto cuando la liga origen no tiene ninguna
// configurada — mismo default que usaba el route antes de la extracción.
export const DEFAULT_PLAYOFF_ZONE = {
	name: "Liguilla",
	fromPosition: 1,
	toPosition: 8,
	color: "green",
	order: 0,
} as const;
