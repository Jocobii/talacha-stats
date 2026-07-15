/**
 * src/db/simulator/identity.ts
 *
 * Generador de identidad única para el Organization Simulator — ver
 * docs/ORGANIZATION-SIMULATOR.md §6 y §9 (Épica A2).
 *
 * Produce ternas (nombre canónico único, CURP sintético con formato válido,
 * fecha de nacimiento dispersa) listas para insertarse en `global_players`.
 * La unicidad real la garantiza el UNIQUE de `curp_hash` en Postgres; este
 * generador además lleva sets en memoria para no desperdiciar inserts
 * fallidos durante una corrida XL.
 *
 * El CURP nunca se persiste — solo su hash (ver global_players.curpHash en
 * schema.ts). Es sintético: sigue el formato de 18 caracteres pero no
 * pretende pasar la validación oficial del RENAPO.
 */

import { createHash } from "crypto";
import { sanitizeToCanonical } from "@/shared/lib/normalize";
import { pick, rngInt, type Rng } from "./rng";

// ---------------------------------------------------------------------------
// Pools de nombres — combinatoria suficientemente grande para tier XL
// (40 nombres × 39 paterno × 38 materno ≈ 59k combinaciones antes de
// necesitar reintentos por colisión de nombre canónico).
// ---------------------------------------------------------------------------

export const FIRST_NAMES = [
	"Carlos",
	"Miguel",
	"José",
	"Juan",
	"Luis",
	"Roberto",
	"Fernando",
	"Eduardo",
	"Ricardo",
	"Antonio",
	"Alejandro",
	"Manuel",
	"Jorge",
	"Héctor",
	"Sergio",
	"Rafael",
	"Adrián",
	"Daniel",
	"Oscar",
	"Armando",
	"Gerardo",
	"Christian",
	"Iván",
	"Diego",
	"Ernesto",
	"Mario",
	"Salvador",
	"Jesús",
	"Francisco",
	"Pedro",
	"David",
	"Arturo",
	"Raúl",
	"Alan",
	"Víctor",
	"René",
	"Ramón",
	"Gabriel",
	"Erick",
	"Abraham",
] as const;

export const LAST_NAMES = [
	"García",
	"Hernández",
	"López",
	"Martínez",
	"González",
	"Rodríguez",
	"Pérez",
	"Sánchez",
	"Ramírez",
	"Torres",
	"Flores",
	"Rivera",
	"Gómez",
	"Díaz",
	"Reyes",
	"Cruz",
	"Morales",
	"Ramos",
	"Romero",
	"Jiménez",
	"Álvarez",
	"Ruiz",
	"Castillo",
	"Vargas",
	"Mendoza",
	"Ortiz",
	"Castro",
	"Herrera",
	"Guerrero",
	"Medina",
	"Vásquez",
	"Núñez",
	"Rojas",
	"Gutiérrez",
	"Aguilar",
	"Navarro",
	"Salinas",
	"Campos",
	"Estrada",
] as const;

// Códigos de entidad federativa — formato CURP oficial (no se valida contra
// catálogo real; solo necesita "verse" como CURP).
const STATE_CODES = [
	"BC",
	"BS",
	"CH",
	"CL",
	"CX",
	"DF",
	"DG",
	"GR",
	"GT",
	"HG",
	"JC",
	"MC",
	"MN",
	"MS",
	"NE",
	"NL",
	"NT",
	"OC",
	"PL",
	"QR",
	"SL",
	"SP",
	"SR",
	"TC",
	"TL",
	"TS",
	"VZ",
	"YN",
	"ZS",
] as const;

const HOMOCLAVE_CHARSET = "0123456789ABCDEFGHIJKLMNPQRSTUVWXYZ"; // sin O (ambiguo con 0)

export type Sex = "H" | "M";

export interface GeneratedIdentity {
	firstName: string;
	paternalLastName: string;
	maternalLastName: string;
	fullName: string;
	/** Forma canónica — igual a lo que espera global_players.fullNameCanonical. */
	fullNameCanonical: string;
	birthDate: string; // "YYYY-MM-DD"
	sex: Sex;
	/** CURP sintético completo — NUNCA persistir, solo derivar curpHash. */
	curp: string;
	curpHash: string;
}

function normalizeLetter(s: string): string {
	return (
		s
			.normalize("NFD")
			.replace(/[̀-ͯ]/g, "")
			.toUpperCase()
			.match(/[A-ZÑ]/)?.[0] ?? "X"
	);
}

const VOWELS = new Set(["A", "E", "I", "O", "U"]);
const CONSONANTS = new Set("BCDFGHJKLMNÑPQRSTVWXYZ".split(""));

function bareLetters(s: string): string[] {
	return s
		.normalize("NFD")
		.replace(/[̀-ͯ]/g, "")
		.toUpperCase()
		.replace(/[^A-ZÑ]/g, "")
		.split("");
}

function firstInternalVowel(s: string): string {
	const letters = bareLetters(s);
	for (let i = 1; i < letters.length; i++) {
		if (VOWELS.has(letters[i])) return letters[i];
	}
	return "X";
}

function firstInternalConsonant(s: string): string {
	const letters = bareLetters(s);
	for (let i = 1; i < letters.length; i++) {
		if (CONSONANTS.has(letters[i])) return letters[i];
	}
	return "X";
}

/**
 * Construye el CURP sintético de 18 caracteres a partir de las partes del
 * nombre + fecha de nacimiento + un "homoclave" que el llamador controla
 * para garantizar unicidad (el generador de identidad lo incrementa hasta
 * no chocar con `usedCurps`).
 */
export function buildSyntheticCurp(parts: {
	firstName: string;
	paternalLastName: string;
	maternalLastName: string;
	birthDate: string; // "YYYY-MM-DD"
	sex: Sex;
	stateCode: string;
	homoclaveSeed: number;
}): string {
	const { firstName, paternalLastName, maternalLastName, birthDate, sex, stateCode } = parts;

	const p1 = normalizeLetter(paternalLastName[0] ?? "X");
	const p2 = firstInternalVowel(paternalLastName);
	const p3 = normalizeLetter(maternalLastName[0] ?? "X");
	const p4 = normalizeLetter(firstName[0] ?? "X");

	const [year, month, day] = birthDate.split("-");
	const yy = year.slice(-2);
	const dateSegment = `${yy}${month}${day}`;

	const c1 = firstInternalConsonant(paternalLastName);
	const c2 = firstInternalConsonant(maternalLastName);
	const c3 = firstInternalConsonant(firstName);

	const homoclave = HOMOCLAVE_CHARSET[parts.homoclaveSeed % HOMOCLAVE_CHARSET.length];
	const checkDigit = parts.homoclaveSeed % 10;

	return `${p1}${p2}${p3}${p4}${dateSegment}${sex}${stateCode}${c1}${c2}${c3}${homoclave}${checkDigit}`;
}

export function hashCurp(curp: string): string {
	return createHash("sha256").update(curp).digest("hex");
}

/**
 * Fecha de nacimiento pseudoaleatoria dispersa entre `minAge` y `maxAge`
 * años antes de `now`. Formato "YYYY-MM-DD".
 */
export function randomBirthDate(
	rng: Rng,
	now: Date = new Date(),
	minAge = 18,
	maxAge = 45,
): string {
	const age = rngInt(rng, minAge, maxAge);
	const birthYear = now.getUTCFullYear() - age;
	const month = rngInt(rng, 1, 12);
	// 28 para evitar líos de días inválidos en febrero — suficiente dispersión.
	const day = rngInt(rng, 1, 28);
	const mm = String(month).padStart(2, "0");
	const dd = String(day).padStart(2, "0");
	return `${birthYear}-${mm}-${dd}`;
}

/**
 * Genera identidades únicas (CURP + nombre canónico) para poblar
 * `global_players`. Mantiene sets internos de nombres canónicos y CURPs ya
 * emitidos en esta corrida — la unicidad final la sigue garantizando el
 * UNIQUE de la base de datos, esto solo evita inserts fallidos innecesarios.
 */
export class IdentityGenerator {
	private readonly usedCanonical = new Set<string>();
	private readonly usedCurps = new Set<string>();
	private homoclaveCounter = 0;

	constructor(
		private readonly rng: Rng,
		private readonly options: {
			firstNames?: readonly string[];
			lastNames?: readonly string[];
			now?: Date;
			minAge?: number;
			maxAge?: number;
			/** Fracción [0,1] de jugadoras (sex "M") — default 0.15. */
			femaleRatio?: number;
		} = {},
	) {}

	/** Registra identidades ya existentes en DB para no volver a chocar. */
	seedExisting(existing: { fullNameCanonical: string | null; curpHash: string }[]): void {
		for (const row of existing) {
			if (row.fullNameCanonical) this.usedCanonical.add(row.fullNameCanonical);
			this.usedCurps.add(row.curpHash);
		}
	}

	next(): GeneratedIdentity {
		const firstNames = this.options.firstNames ?? FIRST_NAMES;
		const lastNames = this.options.lastNames ?? LAST_NAMES;
		const now = this.options.now ?? new Date();
		const minAge = this.options.minAge ?? 18;
		const maxAge = this.options.maxAge ?? 45;
		const femaleRatio = this.options.femaleRatio ?? 0.15;

		const MAX_ATTEMPTS = 500;
		for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
			const firstName = pick(this.rng, firstNames);
			const paternalLastName = pick(this.rng, lastNames);
			const maternalLastName = pick(this.rng, lastNames);
			const fullName = `${firstName} ${paternalLastName} ${maternalLastName}`;
			const fullNameCanonical = sanitizeToCanonical(fullName);

			if (this.usedCanonical.has(fullNameCanonical)) continue;

			const sex: Sex = this.rng() < femaleRatio ? "M" : "H";
			const birthDate = randomBirthDate(this.rng, now, minAge, maxAge);
			const stateCode = pick(this.rng, STATE_CODES);

			let curp = "";
			let curpHash = "";
			let curpAttempt = 0;
			do {
				curp = buildSyntheticCurp({
					firstName,
					paternalLastName,
					maternalLastName,
					birthDate,
					sex,
					stateCode,
					homoclaveSeed: this.homoclaveCounter++,
				});
				curpHash = hashCurp(curp);
				curpAttempt++;
			} while (this.usedCurps.has(curpHash) && curpAttempt < 50);

			if (this.usedCurps.has(curpHash)) continue; // extremadamente improbable

			this.usedCanonical.add(fullNameCanonical);
			this.usedCurps.add(curpHash);

			return {
				firstName,
				paternalLastName,
				maternalLastName,
				fullName,
				fullNameCanonical,
				birthDate,
				sex,
				curp,
				curpHash,
			};
		}

		throw new Error(
			`IdentityGenerator: no se pudo generar una identidad única tras ${MAX_ATTEMPTS} intentos. ` +
				"Aumenta los pools de nombres (firstNames/lastNames) para este volumen.",
		);
	}

	nextN(n: number): GeneratedIdentity[] {
		return Array.from({ length: n }, () => this.next());
	}
}
