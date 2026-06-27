/**
 * features/scheduling/pairing-generator/generate-pairings.ts
 * Orquestador de la Capa 1: circle method → aplicar descansos → validar S4.
 * Función pura — sin efectos de red, sin DB, testeable en aislamiento.
 */

import type { GeneratedMatchday } from "../types";
import { generateRoundRobin } from "./circle-method";
import { applyRestRequests, type RestRequest } from "./apply-rest-requests";
import { validateNoDuplicates } from "./validate-no-duplicates";

export type GeneratePairingsInput = {
	teamIds: string[];
	seed: number;
	restRequests: RestRequest[];
};

export type GeneratePairingsResult =
	| { ok: true; matchdays: GeneratedMatchday[] }
	| { ok: false; error: string; duplicates?: ReturnType<typeof validateNoDuplicates> };

export function generatePairings(input: GeneratePairingsInput): GeneratePairingsResult {
	if (input.teamIds.length < 2) {
		return { ok: false, error: "Se necesitan al menos 2 equipos para generar el sorteo" };
	}

	const rounds = generateRoundRobin(input.teamIds, input.seed);

	const withRests = applyRestRequests(rounds, input.restRequests);
	if (!withRests.ok) return { ok: false, error: withRests.error };

	const validation = validateNoDuplicates(withRests.rounds);
	if (!validation.ok) {
		return {
			ok: false,
			error: `El sorteo generó ${validation.duplicates.length} par(es) duplicado(s) en la fase regular`,
			duplicates: validation,
		};
	}

	const matchdays: GeneratedMatchday[] = withRests.rounds.map((pairings, i) => ({
		number: i + 1,
		phase: "regular",
		pairings,
	}));

	return { ok: true, matchdays };
}
