/**
 * src/db/simulator/rng.ts
 *
 * PRNG sembrado (mulberry32) para el Organization Simulator — ver
 * docs/ORGANIZATION-SIMULATOR.md §2.2 y §9 (Épica A1).
 *
 * Nunca usar Math.random() dentro del simulador: toda aleatoriedad pasa por
 * este generador para que la misma semilla produzca siempre el mismo
 * dataset, sin importar el tier (S/M/L/XL). Eso es lo que permite reproducir
 * un bug de rendimiento las veces que haga falta.
 */

export type Rng = () => number;

/**
 * mulberry32 — PRNG rápido, determinista y con buena distribución para
 * generación de datos sintéticos (no es criptográficamente seguro, y no
 * necesita serlo).
 *
 * Misma semilla ⇒ misma secuencia de números en [0, 1).
 */
export function createRng(seed: number): Rng {
	let a = seed >>> 0;
	return function mulberry32(): number {
		a |= 0;
		a = (a + 0x6d2b79f5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

/** Entero pseudoaleatorio en [min, max], ambos inclusive. */
export function rngInt(rng: Rng, min: number, max: number): number {
	if (max < min) throw new Error(`rngInt: max (${max}) < min (${min})`);
	return Math.floor(rng() * (max - min + 1)) + min;
}

/** Elemento pseudoaleatorio de un arreglo no vacío. */
export function pick<T>(rng: Rng, arr: readonly T[]): T {
	if (arr.length === 0) throw new Error("pick: el arreglo está vacío");
	return arr[Math.floor(rng() * arr.length)];
}

/** Fisher-Yates determinista — no muta el arreglo original. */
export function shuffle<T>(rng: Rng, arr: readonly T[]): T[] {
	const out = [...arr];
	for (let i = out.length - 1; i > 0; i--) {
		const j = Math.floor(rng() * (i + 1));
		[out[i], out[j]] = [out[j], out[i]];
	}
	return out;
}

/** N elementos distintos (por posición) del arreglo, sin reemplazo. */
export function pickN<T>(rng: Rng, arr: readonly T[], n: number): T[] {
	const count = Math.max(0, Math.min(n, arr.length));
	return shuffle(rng, arr).slice(0, count);
}

export interface Weighted<T> {
	item: T;
	weight: number;
}

/** Selección ponderada — probabilidad proporcional a `weight`. */
export function weighted<T>(rng: Rng, items: readonly Weighted<T>[]): T {
	if (items.length === 0) throw new Error("weighted: no hay elementos");
	const total = items.reduce((sum, w) => sum + w.weight, 0);
	if (total <= 0) throw new Error("weighted: la suma de pesos debe ser > 0");
	let r = rng() * total;
	for (const w of items) {
		r -= w.weight;
		if (r <= 0) return w.item;
	}
	return items[items.length - 1].item;
}

/** N elementos ponderados sin reemplazo (cada elección reduce el pool). */
export function weightedN<T>(rng: Rng, items: readonly Weighted<T>[], n: number): T[] {
	const pool = items.map((w) => ({ ...w }));
	const result: T[] = [];
	const count = Math.min(n, pool.length);
	for (let i = 0; i < count; i++) {
		const chosen = weighted(rng, pool);
		result.push(chosen);
		const idx = pool.findIndex((w) => w.item === chosen);
		pool.splice(idx, 1);
	}
	return result;
}
