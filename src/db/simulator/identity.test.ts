import { describe, expect, it } from "vitest";
import { createRng } from "./rng";
import { buildSyntheticCurp, hashCurp, IdentityGenerator, randomBirthDate } from "./identity";

const CURP_FORMAT = /^[A-ZÑ]{4}\d{6}[HM][A-Z]{2}[A-ZÑ]{3}[0-9A-Z]\d$/;

describe("buildSyntheticCurp", () => {
	it("produce un string de 18 caracteres con el formato CURP", () => {
		const curp = buildSyntheticCurp({
			firstName: "Carlos",
			paternalLastName: "García",
			maternalLastName: "López",
			birthDate: "1995-03-14",
			sex: "H",
			stateCode: "BC",
			homoclaveSeed: 0,
		});
		expect(curp).toHaveLength(18);
		expect(curp).toMatch(CURP_FORMAT);
	});

	it("homoclaveSeed distinto produce CURP distinto para la misma persona", () => {
		const base = {
			firstName: "Carlos",
			paternalLastName: "García",
			maternalLastName: "López",
			birthDate: "1995-03-14",
			sex: "H" as const,
			stateCode: "BC",
		};
		const a = buildSyntheticCurp({ ...base, homoclaveSeed: 0 });
		const b = buildSyntheticCurp({ ...base, homoclaveSeed: 1 });
		expect(a).not.toBe(b);
	});
});

describe("hashCurp", () => {
	it("nunca expone el CURP original y es determinista", () => {
		const curp = "GALC950314HBCRPZ01";
		const h1 = hashCurp(curp);
		const h2 = hashCurp(curp);
		expect(h1).toBe(h2);
		expect(h1).not.toContain(curp);
		expect(h1).toMatch(/^[0-9a-f]{64}$/);
	});
});

describe("randomBirthDate", () => {
	it("cae dentro del rango de edad pedido", () => {
		const rng = createRng(21);
		const now = new Date("2026-07-14T00:00:00Z");
		for (let i = 0; i < 200; i++) {
			const birthDate = randomBirthDate(rng, now, 18, 45);
			const year = Number(birthDate.slice(0, 4));
			const age = now.getUTCFullYear() - year;
			expect(age).toBeGreaterThanOrEqual(18);
			expect(age).toBeLessThanOrEqual(45);
		}
	});
});

describe("IdentityGenerator", () => {
	it("misma semilla produce el mismo dataset", () => {
		const genA = new IdentityGenerator(createRng(99));
		const genB = new IdentityGenerator(createRng(99));
		const a = genA.nextN(20);
		const b = genB.nextN(20);
		expect(a).toEqual(b);
	});

	it("nunca repite fullNameCanonical ni curpHash en una corrida grande", () => {
		const gen = new IdentityGenerator(createRng(123));
		const identities = gen.nextN(500);
		const canonicalSet = new Set(identities.map((i) => i.fullNameCanonical));
		const curpHashSet = new Set(identities.map((i) => i.curpHash));
		expect(canonicalSet.size).toBe(identities.length);
		expect(curpHashSet.size).toBe(identities.length);
	});

	it("cada CURP generado respeta el formato válido", () => {
		const gen = new IdentityGenerator(createRng(5));
		const identities = gen.nextN(50);
		for (const identity of identities) {
			expect(identity.curp).toMatch(CURP_FORMAT);
		}
	});

	it("respeta las identidades ya existentes pasadas por seedExisting", () => {
		const gen = new IdentityGenerator(createRng(7));
		const first = gen.next();

		const gen2 = new IdentityGenerator(createRng(7));
		gen2.seedExisting([{ fullNameCanonical: first.fullNameCanonical, curpHash: first.curpHash }]);
		const second = gen2.next();

		expect(second.fullNameCanonical).not.toBe(first.fullNameCanonical);
	});

	it("nunca genera fecha de nacimiento fuera del rango configurado", () => {
		const gen = new IdentityGenerator(createRng(3), { minAge: 20, maxAge: 25 });
		const now = new Date();
		for (const identity of gen.nextN(30)) {
			const age = now.getUTCFullYear() - Number(identity.birthDate.slice(0, 4));
			expect(age).toBeGreaterThanOrEqual(20);
			expect(age).toBeLessThanOrEqual(25);
		}
	});
});
