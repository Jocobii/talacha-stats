import { describe, expect, it } from "vitest";
import { createRng, pick, pickN, rngInt, shuffle, weighted, weightedN } from "./rng";

describe("createRng", () => {
	it("misma semilla produce la misma secuencia", () => {
		const a = createRng(42);
		const b = createRng(42);
		const seqA = Array.from({ length: 10 }, () => a());
		const seqB = Array.from({ length: 10 }, () => b());
		expect(seqA).toEqual(seqB);
	});

	it("semillas distintas producen secuencias distintas", () => {
		const a = createRng(1);
		const b = createRng(2);
		const seqA = Array.from({ length: 10 }, () => a());
		const seqB = Array.from({ length: 10 }, () => b());
		expect(seqA).not.toEqual(seqB);
	});

	it("siempre devuelve valores en [0, 1)", () => {
		const rng = createRng(7);
		for (let i = 0; i < 1000; i++) {
			const v = rng();
			expect(v).toBeGreaterThanOrEqual(0);
			expect(v).toBeLessThan(1);
		}
	});
});

describe("rngInt", () => {
	it("respeta el rango inclusive", () => {
		const rng = createRng(3);
		for (let i = 0; i < 500; i++) {
			const v = rngInt(rng, 5, 8);
			expect(v).toBeGreaterThanOrEqual(5);
			expect(v).toBeLessThanOrEqual(8);
		}
	});

	it("lanza si max < min", () => {
		const rng = createRng(3);
		expect(() => rngInt(rng, 8, 5)).toThrow();
	});
});

describe("pick", () => {
	it("elige un elemento del arreglo", () => {
		const rng = createRng(9);
		const arr = ["a", "b", "c"];
		expect(arr).toContain(pick(rng, arr));
	});

	it("lanza con arreglo vacío", () => {
		const rng = createRng(9);
		expect(() => pick(rng, [])).toThrow();
	});
});

describe("shuffle", () => {
	it("no muta el arreglo original", () => {
		const rng = createRng(1);
		const arr = [1, 2, 3, 4, 5];
		const copy = [...arr];
		shuffle(rng, arr);
		expect(arr).toEqual(copy);
	});

	it("preserva los mismos elementos", () => {
		const rng = createRng(1);
		const arr = [1, 2, 3, 4, 5];
		const out = shuffle(rng, arr);
		expect(out.slice().sort()).toEqual(arr.slice().sort());
	});

	it("misma semilla produce el mismo orden", () => {
		const arr = [1, 2, 3, 4, 5, 6, 7, 8];
		const a = shuffle(createRng(11), arr);
		const b = shuffle(createRng(11), arr);
		expect(a).toEqual(b);
	});
});

describe("pickN", () => {
	it("devuelve n elementos únicos por posición", () => {
		const rng = createRng(4);
		const arr = ["a", "b", "c", "d", "e"];
		const out = pickN(rng, arr, 3);
		expect(out).toHaveLength(3);
		expect(new Set(out).size).toBe(3);
	});

	it("clampa n al tamaño del arreglo", () => {
		const rng = createRng(4);
		const arr = ["a", "b"];
		expect(pickN(rng, arr, 10)).toHaveLength(2);
	});
});

describe("weighted", () => {
	it("solo elige elementos con peso > 0 en el largo plazo", () => {
		const rng = createRng(5);
		const items = [
			{ item: "nunca", weight: 0 },
			{ item: "siempre", weight: 1 },
		];
		const results = new Set(Array.from({ length: 200 }, () => weighted(rng, items)));
		expect(results.has("nunca")).toBe(false);
		expect(results.has("siempre")).toBe(true);
	});

	it("lanza si la suma de pesos es 0", () => {
		const rng = createRng(5);
		expect(() => weighted(rng, [{ item: "x", weight: 0 }])).toThrow();
	});
});

describe("weightedN", () => {
	it("no repite elementos", () => {
		const rng = createRng(6);
		const items = [
			{ item: "a", weight: 5 },
			{ item: "b", weight: 3 },
			{ item: "c", weight: 1 },
		];
		const out = weightedN(rng, items, 3);
		expect(new Set(out).size).toBe(3);
	});

	it("clampa n al número de elementos disponibles", () => {
		const rng = createRng(6);
		const items = [{ item: "a", weight: 1 }];
		expect(weightedN(rng, items, 5)).toHaveLength(1);
	});
});
