/**
 * features/scheduling/pairing-generator/apply-rest-requests.ts
 *
 * Aplica descansos solicitados a los pairings generados por el circle method.
 * Estrategia: intercambiar el equipo que descansa con el slot BYE de esa jornada.
 * Si no hay BYE disponible (N par sin descansos naturales), devuelve error.
 *
 * Ref: scheduling-plan.md §4.1
 */

import type { Pairing } from "../types";
import { pairKey } from "../lib/pair-key";

export type RestRequest = { teamId: string; matchdayNumber: number };

export type ApplyRestsResult = { ok: true; rounds: Pairing[][] } | { ok: false; error: string };

/** Busca el índice del pairing donde aparece `teamId` en la jornada dada. */
function findTeamIndex(round: Pairing[], teamId: string): number {
	return round.findIndex((p) => p.homeTeamId === teamId || p.awayTeamId === teamId);
}

/** Busca el índice del pairing BYE (awayTeamId === null) en la jornada. */
function findByeIndex(round: Pairing[]): number {
	return round.findIndex((p) => p.awayTeamId === null);
}

/**
 * Intercambia el equipo que descansa con el slot BYE.
 * El rival del equipo descansante pasa a ser el BYE del BYE
 * (es decir, pasa a descansar también — situación válida en N impar).
 */
function swapWithBye(round: Pairing[], teamIdx: number, byeIdx: number): Pairing[] {
	const updated = [...round];
	const teamPairing = updated[teamIdx]!;
	const rival =
		teamPairing.homeTeamId === updated[teamIdx]!.homeTeamId
			? teamPairing.awayTeamId
			: teamPairing.homeTeamId;

	// El equipo que descansa recibe BYE
	updated[teamIdx] = {
		homeTeamId: updated[teamIdx]!.homeTeamId === null ? rival! : updated[teamIdx]!.homeTeamId,
		awayTeamId: null,
	};
	// El ex-BYE juega contra el rival del equipo que descansa
	updated[byeIdx] = {
		homeTeamId: updated[byeIdx]!.homeTeamId ?? rival!,
		awayTeamId: rival ?? null,
	};
	return updated;
}

export function applyRestRequests(rounds: Pairing[][], rests: RestRequest[]): ApplyRestsResult {
	const result = rounds.map((r) => [...r]);
	const usedByes = new Set<string>(); // "roundIndex::byeTeamId"

	for (const rest of rests) {
		const roundIdx = rest.matchdayNumber - 1;
		if (roundIdx < 0 || roundIdx >= result.length) {
			return { ok: false, error: `Jornada ${rest.matchdayNumber} fuera de rango` };
		}

		const round = result[roundIdx]!;
		const teamIdx = findTeamIndex(round, rest.teamId);
		if (teamIdx === -1) {
			return {
				ok: false,
				error: `Equipo ${rest.teamId} no encontrado en jornada ${rest.matchdayNumber}`,
			};
		}

		const byeIdx = findByeIndex(round);
		if (byeIdx === -1) {
			return {
				ok: false,
				error: `Jornada ${rest.matchdayNumber}: no hay slot BYE disponible para el descanso solicitado (liga con número par de equipos sin BYE natural)`,
			};
		}

		const key = `${roundIdx}::${pairKey(rest.teamId, null)}`;
		if (usedByes.has(key)) {
			return {
				ok: false,
				error: `Equipo ${rest.teamId} ya tiene descanso asignado en jornada ${rest.matchdayNumber}`,
			};
		}

		result[roundIdx] = swapWithBye(round, teamIdx, byeIdx);
		usedByes.add(key);
	}

	return { ok: true, rounds: result };
}
