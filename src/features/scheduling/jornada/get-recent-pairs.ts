/**
 * features/scheduling/jornada/get-recent-pairs.ts
 *
 * Extrae el Set de pair-keys de las últimas N jornadas pasadas.
 * Función pura — sin DB ni efectos de red.
 */

import { pairKey } from "@/features/scheduling/lib/pair-key";

type MatchdayWithPairings = {
	pairings: Array<{ homeTeamId: string; awayTeamId: string }>;
};

export function getRecentPairs(recentMatchdays: MatchdayWithPairings[]): Set<string> {
	const keys = new Set<string>();

	for (const matchday of recentMatchdays) {
		for (const p of matchday.pairings) {
			keys.add(pairKey(p.homeTeamId, p.awayTeamId));
		}
	}

	return keys;
}
