/**
 * features/scheduling/pairing-generator/validate-no-duplicates.ts
 * Garantiza S4: ningún par de equipos se enfrenta más de una vez en la fase regular.
 * Los pares con BYE (awayTeamId === null) se ignoran — no cuentan como duplicado.
 */

import type { Pairing } from "../types";
import { pairKey } from "../lib/pair-key";

export type DuplicatePair = {
	homeTeamId: string;
	awayTeamId: string;
	rounds: number[]; // jornadas (1-based) donde aparece este par
};

export type ValidateResult = { ok: true } | { ok: false; duplicates: DuplicatePair[] };

export function validateNoDuplicates(rounds: Pairing[][]): ValidateResult {
	/** key → { pairing, rounds[] } */
	const seen = new Map<string, { pairing: Pairing; rounds: number[] }>();

	for (let i = 0; i < rounds.length; i++) {
		for (const pairing of rounds[i]!) {
			if (pairing.awayTeamId === null) continue; // BYE — ignorar

			const key = pairKey(pairing.homeTeamId, pairing.awayTeamId);
			const existing = seen.get(key);
			if (existing) {
				existing.rounds.push(i + 1);
			} else {
				seen.set(key, { pairing, rounds: [i + 1] });
			}
		}
	}

	const duplicates: DuplicatePair[] = [];
	for (const { pairing, rounds } of seen.values()) {
		if (rounds.length > 1) {
			duplicates.push({
				homeTeamId: pairing.homeTeamId,
				awayTeamId: pairing.awayTeamId!,
				rounds,
			});
		}
	}

	return duplicates.length === 0 ? { ok: true } : { ok: false, duplicates };
}
