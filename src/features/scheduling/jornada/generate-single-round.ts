/**
 * features/scheduling/jornada/generate-single-round.ts
 *
 * Genera los pairings para UNA sola jornada usando los equipos presentes.
 * Función pura — sin imports de DB ni efectos de red.
 */

import { pairKey } from "@/features/scheduling/lib/pair-key";
import type { Pairing } from "@/features/scheduling/types";

export type PurchasedSlotInput = {
	teamId: string;
	venueId: string | null;
	startTime: string;
};

export type GenerateSingleRoundInput = {
	presentTeamIds: string[];
	seed: number;
	recentPairKeys: Set<string>;
	purchasedSlots: PurchasedSlotInput[];
};

export type GenerateSingleRoundResult = {
	pairings: Pairing[];
	conflicts: Array<{ homeTeamId: string; awayTeamId: string }>;
};

// ── PRNG ────────────────────────────────────────────────────────────────────

function mulberry32(seed: number): () => number {
	let s = seed;
	return () => {
		s = (s + 0x6d2b79f5) | 0;
		let t = Math.imul(s ^ (s >>> 15), 1 | s);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

function shuffleWithSeed<T>(arr: T[], seed: number): T[] {
	const result = [...arr];
	const rand = mulberry32(seed);
	for (let i = result.length - 1; i > 0; i--) {
		const j = Math.floor(rand() * (i + 1));
		[result[i], result[j]] = [result[j]!, result[i]!];
	}
	return result;
}

// ── Main export ──────────────────────────────────────────────────────────────

export function generateSingleRound(input: GenerateSingleRoundInput): GenerateSingleRoundResult {
	const { presentTeamIds, seed, recentPairKeys, purchasedSlots } = input;

	if (presentTeamIds.length < 2) {
		throw new Error("Se necesitan al menos 2 equipos presentes para sortear");
	}

	const purchasedSet = new Set(purchasedSlots.map((s) => s.teamId));

	const pairings: Pairing[] = [];
	const conflicts: Array<{ homeTeamId: string; awayTeamId: string }> = [];
	const assigned = new Set<string>();

	// Intercalar equipos con slot entre los sin slot:
	//   [slot_0, libre_0, slot_1, libre_1, …, libre_n]
	// Esto garantiza que cada equipo con slot comprado quede adyacente a un equipo
	// sin slot → el greedy los empareja con distintos rivales en lugar de entre sí.
	// Los equipos sobrantes (si hay más sin slot) van al final → el BYE (impar) cae
	// sobre alguien sin slot comprado.
	const withSlot = shuffleWithSeed(
		presentTeamIds.filter((id) => purchasedSet.has(id)),
		seed,
	);
	const withoutSlot = shuffleWithSeed(
		presentTeamIds.filter((id) => !purchasedSet.has(id)),
		seed ^ 0xdeadbeef,
	);
	const pool: string[] = [];
	const maxLen = Math.max(withSlot.length, withoutSlot.length);
	for (let i = 0; i < maxLen; i++) {
		if (i < withSlot.length) pool.push(withSlot[i]!);
		if (i < withoutSlot.length) pool.push(withoutSlot[i]!);
	}
	pairFreePool(pool, recentPairKeys, pairings, conflicts, assigned, [...purchasedSet]);

	return { pairings, conflicts };
}

/**
 * Greedy matching sobre el pool libre.
 * El primer equipo de la lista con slot fijo (si existe en el par) es home.
 */
function pairFreePool(
	pool: string[],
	recentPairKeys: Set<string>,
	pairings: Pairing[],
	conflicts: Array<{ homeTeamId: string; awayTeamId: string }>,
	assigned: Set<string>,
	fixedSlotIds: string[],
): void {
	const fixedSet = new Set(fixedSlotIds);

	for (let i = 0; i < pool.length; i++) {
		const teamA = pool[i]!;
		if (assigned.has(teamA)) continue;

		// Buscar primer compañero no asignado sin conflicto reciente
		let partner: string | null = findPartner(teamA, pool, i + 1, assigned, recentPairKeys, false);

		// Si no hay sin conflicto, forzar el primero disponible
		if (!partner) {
			partner = findPartner(teamA, pool, i + 1, assigned, recentPairKeys, true);
		}

		if (!partner) {
			// Número impar: BYE
			pairings.push({ homeTeamId: teamA, awayTeamId: null });
			assigned.add(teamA);
			continue;
		}

		assigned.add(teamA);
		assigned.add(partner);

		// El equipo con slot fijo es home; si ambos/ninguno, teamA es home
		const homeFirst = fixedSet.has(teamA) && !fixedSet.has(partner);
		const home = homeFirst ? teamA : partner;
		const away = homeFirst ? partner : teamA;

		const isConflict = recentPairKeys.has(pairKey(home, away));
		pairings.push({ homeTeamId: home, awayTeamId: away });
		if (isConflict) conflicts.push({ homeTeamId: home, awayTeamId: away });
	}
}

function findPartner(
	teamId: string,
	pool: string[],
	startIndex: number,
	assigned: Set<string>,
	recentPairKeys: Set<string>,
	allowConflict: boolean,
): string | null {
	for (let k = startIndex; k < pool.length; k++) {
		const candidate = pool[k]!;
		if (assigned.has(candidate)) continue;
		const hasConflict = recentPairKeys.has(pairKey(teamId, candidate));
		if (!allowConflict && hasConflict) continue;
		return candidate;
	}
	return null;
}
