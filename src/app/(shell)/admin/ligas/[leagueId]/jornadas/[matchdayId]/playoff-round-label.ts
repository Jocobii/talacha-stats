/**
 * playoff-round-label.ts
 *
 * Traduce (round, maxRound, isThirdPlace) de un playoff_slot a la etiqueta
 * humana de la ronda ("Cuartos de Final", "Semifinal", "Final", "Tercer
 * Lugar"). El bracket-generator solo soporta tamaños 2/4/8 (ver
 * features/playoffs/lib/bracket-generator.ts), así que maxRound nunca pasa
 * de 3 — el fallback "Ronda N" es solo defensivo.
 */

export function playoffRoundLabel(round: number, maxRound: number, isThirdPlace: boolean): string {
	if (isThirdPlace) return "Tercer Lugar";

	const roundsFromFinal = maxRound - round;
	switch (roundsFromFinal) {
		case 0:
			return "Final";
		case 1:
			return "Semifinal";
		case 2:
			return "Cuartos de Final";
		case 3:
			return "Octavos de Final";
		default:
			return `Ronda ${round}`;
	}
}
