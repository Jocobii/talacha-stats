import { describe, expect, it, vi } from "vitest";
import { createRng } from "./rng";
import {
	createSimContext,
	getData,
	requireData,
	runContributors,
	setData,
	SIM_TIERS,
	validateTopologicalOrder,
	type Contributor,
	type DbOrTx,
} from "./context";

// El registro/orquestador no toca la base — un stub basta para estas pruebas.
const FAKE_DB = {} as unknown as DbOrTx;

describe("createSimContext", () => {
	it("usa maxJornadasPerRun del tier por default", () => {
		const ctx = createSimContext({ db: FAKE_DB, rng: createRng(1), seed: 1, tier: "S" });
		expect(ctx.jornadasToAdvance).toBe(SIM_TIERS.S.maxJornadasPerRun);
		expect(ctx.params).toEqual(SIM_TIERS.S);
		expect(ctx.temporadas).toBe(1);
		expect(ctx.data).toEqual({});
	});

	it("acepta jornadasToAdvance dentro de rango", () => {
		const ctx = createSimContext({
			db: FAKE_DB,
			rng: createRng(1),
			seed: 1,
			tier: "M",
			jornadasToAdvance: 3,
		});
		expect(ctx.jornadasToAdvance).toBe(3);
	});

	it("lanza si jornadasToAdvance está fuera de rango", () => {
		expect(() =>
			createSimContext({
				db: FAKE_DB,
				rng: createRng(1),
				seed: 1,
				tier: "S",
				jornadasToAdvance: 0,
			}),
		).toThrow();
		expect(() =>
			createSimContext({
				db: FAKE_DB,
				rng: createRng(1),
				seed: 1,
				tier: "S",
				jornadasToAdvance: 6,
			}),
		).toThrow();
	});
});

describe("getData / setData / requireData", () => {
	it("setData escribe y getData lee la misma clave", () => {
		const ctx = createSimContext({ db: FAKE_DB, rng: createRng(1), seed: 1, tier: "S" });
		setData(ctx, "orgs", ["a", "b"]);
		expect(getData<string[]>(ctx, "orgs")).toEqual(["a", "b"]);
	});

	it("getData devuelve undefined si la clave no existe", () => {
		const ctx = createSimContext({ db: FAKE_DB, rng: createRng(1), seed: 1, tier: "S" });
		expect(getData(ctx, "nope")).toBeUndefined();
	});

	it("requireData lanza si la clave no existe", () => {
		const ctx = createSimContext({ db: FAKE_DB, rng: createRng(1), seed: 1, tier: "S" });
		expect(() => requireData(ctx, "nope")).toThrow();
	});

	it("requireData devuelve el valor si existe", () => {
		const ctx = createSimContext({ db: FAKE_DB, rng: createRng(1), seed: 1, tier: "S" });
		setData(ctx, "orgs", 42);
		expect(requireData(ctx, "orgs")).toBe(42);
	});
});

function makeContributor(
	name: string,
	dependsOn: string[] = [],
): Contributor & {
	calls: number;
} {
	const c = {
		name,
		dependsOn,
		calls: 0,
		async contribute() {
			c.calls++;
		},
	};
	return c;
}

describe("validateTopologicalOrder", () => {
	it("acepta un registro bien ordenado", () => {
		const identity = makeContributor("identity");
		const structure = makeContributor("structure", ["identity"]);
		const enrollment = makeContributor("enrollment", ["structure"]);
		expect(() => validateTopologicalOrder([identity, structure, enrollment])).not.toThrow();
	});

	it("lanza si un contribuidor depende de algo que corre después", () => {
		const structure = makeContributor("structure", ["identity"]);
		const identity = makeContributor("identity");
		expect(() => validateTopologicalOrder([structure, identity])).toThrow(/depende de "identity"/);
	});

	it("lanza si un contribuidor depende de un nombre inexistente", () => {
		const orphan = makeContributor("orphan", ["ghost"]);
		expect(() => validateTopologicalOrder([orphan])).toThrow(/"ghost"/);
	});

	it("lanza con nombres duplicados en el registro", () => {
		const a = makeContributor("dup");
		const b = makeContributor("dup");
		expect(() => validateTopologicalOrder([a, b])).toThrow(/duplicado/);
	});

	it("lanza si un contribuidor depende de sí mismo", () => {
		const selfDep = makeContributor("loop", ["loop"]);
		expect(() => validateTopologicalOrder([selfDep])).toThrow(/sí mismo/);
	});
});

describe("runContributors", () => {
	it("corre cada contribuidor exactamente una vez, en orden", async () => {
		const order: string[] = [];
		const identity: Contributor = {
			name: "identity",
			dependsOn: [],
			async contribute() {
				order.push("identity");
			},
		};
		const structure: Contributor = {
			name: "structure",
			dependsOn: ["identity"],
			async contribute() {
				order.push("structure");
			},
		};
		const ctx = createSimContext({ db: FAKE_DB, rng: createRng(1), seed: 1, tier: "S" });
		await runContributors([identity, structure], ctx);
		expect(order).toEqual(["identity", "structure"]);
	});

	it("no corre nada si la validación de orden falla", async () => {
		const spy = vi.fn(async () => {});
		const bad: Contributor = { name: "bad", dependsOn: ["missing"], contribute: spy };
		await expect(
			runContributors(
				[bad],
				createSimContext({ db: FAKE_DB, rng: createRng(1), seed: 1, tier: "S" }),
			),
		).rejects.toThrow();
		expect(spy).not.toHaveBeenCalled();
	});

	it("pasa el mismo ctx compartido a todos los contribuidores", async () => {
		const seenCtx: unknown[] = [];
		const a: Contributor = {
			name: "a",
			dependsOn: [],
			async contribute(ctx) {
				setData(ctx, "fromA", 1);
				seenCtx.push(ctx);
			},
		};
		const b: Contributor = {
			name: "b",
			dependsOn: ["a"],
			async contribute(ctx) {
				expect(getData(ctx, "fromA")).toBe(1);
				seenCtx.push(ctx);
			},
		};
		const ctx = createSimContext({ db: FAKE_DB, rng: createRng(1), seed: 1, tier: "S" });
		await runContributors([a, b], ctx);
		expect(seenCtx[0]).toBe(ctx);
		expect(seenCtx[1]).toBe(ctx);
	});
});
