/**
 * features/scheduling/pairing-generator/circle-method.ts
 *
 * Implementa el algoritmo del círculo (Circle Method) para round-robin.
 * - N par: N-1 jornadas, N/2 partidos por jornada.
 * - N impar: se agrega BYE, N jornadas, (N-1)/2 partidos + 1 descanso por jornada.
 * - Mismo seed → mismo sorteo (reproducible y auditable).
 *
 * Ref: scheduling-plan.md §1.2
 */

import type { Pairing } from "../types";

/** PRNG mulberry32 — sembrable, sin dependencias externas. */
function mulberry32(seed: number): () => number {
	let s = seed;
	return () => {
		s = (s + 0x6d2b79f5) | 0;
		let t = Math.imul(s ^ (s >>> 15), 1 | s);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

/** Fisher-Yates shuffle usando el PRNG dado. Muta el array. */
function shuffleInPlace<T>(arr: T[], rand: () => number): void {
	for (let i = arr.length - 1; i > 0; i--) {
		const j = Math.floor(rand() * (i + 1));
		[arr[i], arr[j]] = [arr[j]!, arr[i]!];
	}
}

/** Genera una jornada a partir del estado actual de la rotación. */
function buildRound(rotation: (string | null)[], roundIndex: number): Pairing[] {
	const half = rotation.length / 2;
	const pairings: Pairing[] = [];
	for (let i = 0; i < half; i++) {
		const a = rotation[i]!;
		const b = rotation[rotation.length - 1 - i] ?? null;
		const isEvenRound = roundIndex % 2 === 0;
		pairings.push(
			isEvenRound
				? { homeTeamId: a, awayTeamId: b }
				: { homeTeamId: b ?? a, awayTeamId: b === null ? null : a },
		);
	}
	return pairings;
}

/** Avanza la rotación del círculo (el primer elemento es fijo). */
function rotateCircle(rotation: (string | null)[]): (string | null)[] {
	const n = rotation.length;
	return [rotation[0]!, rotation[n - 1]!, ...rotation.slice(1, n - 1)];
}

/**
 * Genera el calendario round-robin completo.
 * @param teamIds  Lista de IDs de equipos (≥ 2).
 * @param seed     Semilla para el sorteo — mismo seed = mismo resultado.
 * @returns        Array de jornadas; cada jornada es un array de Pairings.
 */
export function generateRoundRobin(teamIds: string[], seed: number): Pairing[][] {
	if (teamIds.length < 2) throw new Error("Se necesitan al menos 2 equipos para generar el sorteo");

	const rand = mulberry32(seed);
	const shuffled = [...teamIds];
	shuffleInPlace(shuffled, rand);

	// Si N impar, agrega BYE para hacer N+1 (par)
	const list: (string | null)[] = shuffled.length % 2 === 0 ? shuffled : [...shuffled, null];
	const totalRounds = list.length - 1;

	const rounds: Pairing[][] = [];
	let rotation = [...list];

	for (let r = 0; r < totalRounds; r++) {
		rounds.push(buildRound(rotation, r));
		rotation = rotateCircle(rotation);
	}

	return rounds;
}
