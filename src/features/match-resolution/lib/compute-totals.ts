/**
 * features/match-resolution/lib/compute-totals.ts
 * Funciones puras para calcular totales del partido.
 * Usan tipos estructurales mínimos para ser compatibles con PlayerStatDraft
 * y con MatchPlayerStatInput (usado en validate-resolution.ts).
 */

type WithGoals = { goals: number };
type WithCards = { yellowCards: number; blueCards: number; redCards: number };
type WithPresent = { isPresent: boolean };

export function computeTeamGoals(players: WithGoals[]): number {
	return players.reduce((acc, p) => acc + p.goals, 0);
}

export function computeTeamCards(players: WithCards[]): {
	yellow: number;
	blue: number;
	red: number;
} {
	return players.reduce(
		(acc, p) => ({
			yellow: acc.yellow + p.yellowCards,
			blue: acc.blue + p.blueCards,
			red: acc.red + p.redCards,
		}),
		{ yellow: 0, blue: 0, red: 0 },
	);
}

export function computePresentCount(players: WithPresent[]): number {
	return players.filter((p) => p.isPresent).length;
}

/**
 * Calcula la diferencia entre el marcador y la suma de goles atribuidos.
 * Positivo = goles sin atribuir (faltan stats de jugador).
 * Negativo = sobran goles atribuidos (inconsistencia).
 * Cero = cuadrado.
 */
export function computeAttributionGap(
	score: number | null,
	playerSum: number,
	bonus: number,
): number {
	if (score === null) return 0;
	return score - playerSum - bonus;
}
