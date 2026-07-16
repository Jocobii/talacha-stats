/**
 * src/db/simulator/context.ts
 *
 * SimContext + contrato Contributor + orquestador — ver
 * docs/ORGANIZATION-SIMULATOR.md §3 y §9 (Épica A3).
 *
 * El Organization Simulator es una lista ordenada de "contribuidores": cada
 * uno declara de qué otros depende, lee lo que necesita de `ctx.data` y
 * escribe lo suyo ahí mismo. El orquestador solo valida el orden y corre la
 * lista — nunca conoce el detalle de ningún módulo. Feature nueva = archivo
 * de contribuidor nuevo + registrarlo; el orquestador no se toca.
 */

// `import type` — se borra por completo en tiempo de compilación. Nunca
// importar `db` como valor aquí: este módulo (y los contribuidores que lo
// usan) deben poder correr en tests unitarios con un fake sin abrir un Pool
// de Postgres real ni disparar la validación de env de "@/db" (que hace
// process.exit(1) si faltan variables — ver shared/env.ts).
import type { db } from "@/db";
import type { Rng } from "./rng";

/** Misma convención que el resto del repo (ver entities/.../queries.ts). */
export type DbTx = Parameters<Parameters<typeof db.transaction>[0]>[0];
export type DbOrTx = typeof db | DbTx;

export type SimTier = "S" | "M" | "L" | "XL";

export interface SimTierParams {
	/** Organizaciones a generar (solo aplica en la primera corrida). */
	orgs: number;
	leaguesPerOrg: number;
	teamsPerLeague: number;
	playersPerTeam: number;
	/** Rango de jornadas que puede avanzar una sola corrida. */
	minJornadasPerRun: number;
	maxJornadasPerRun: number;
}

/** Tiers de volumen — ver docs/ORGANIZATION-SIMULATOR.md §3. */
export const SIM_TIERS: Record<SimTier, SimTierParams> = {
	S: {
		orgs: 1,
		leaguesPerOrg: 1,
		teamsPerLeague: 8,
		playersPerTeam: 8,
		minJornadasPerRun: 1,
		maxJornadasPerRun: 5,
	},
	M: {
		orgs: 1,
		leaguesPerOrg: 3,
		teamsPerLeague: 10,
		playersPerTeam: 10,
		minJornadasPerRun: 1,
		maxJornadasPerRun: 5,
	},
	L: {
		orgs: 1,
		leaguesPerOrg: 6,
		teamsPerLeague: 12,
		playersPerTeam: 12,
		minJornadasPerRun: 1,
		maxJornadasPerRun: 5,
	},
	XL: {
		orgs: 3,
		leaguesPerOrg: 6,
		teamsPerLeague: 14,
		playersPerTeam: 14,
		minJornadasPerRun: 1,
		maxJornadasPerRun: 5,
	},
};

/** 1 temporada = 20 jornadas (docs/ORGANIZATION-SIMULATOR.md §3). */
export const JORNADAS_PER_TEMPORADA = 20;

export interface SimContext {
	rng: Rng;
	seed: number;
	tier: SimTier;
	params: SimTierParams;
	/** Jornadas a avanzar en esta corrida (1–5, dentro de params). */
	jornadasToAdvance: number;
	/** Multiplicador de temporadas a generar de un tirón. */
	temporadas: number;
	/**
	 * Handle de Postgres (drizzle) — normalmente una transacción abierta por
	 * el caller (CLI/API route) para que toda la corrida sea atómica. Los
	 * contribuidores nunca abren su propia transacción, solo usan esta.
	 */
	db: DbOrTx;
	/**
	 * Bolsa compartida entre contribuidores. Tipado laxo a propósito: el
	 * orquestador no conoce el shape real de nada — cada contribuidor sabe
	 * qué clave lee y qué clave escribe. Usar `getData`/`setData` (abajo)
	 * para tener algo de seguridad de tipos en los contribuidores.
	 */
	data: Record<string, unknown>;
}

export function getData<T>(ctx: SimContext, key: string): T | undefined {
	return ctx.data[key] as T | undefined;
}

export function requireData<T>(ctx: SimContext, key: string): T {
	if (!(key in ctx.data)) {
		throw new Error(
			`SimContext: falta ctx.data["${key}"]. ¿El contribuidor que lo produce ya corrió?`,
		);
	}
	return ctx.data[key] as T;
}

export function setData<T>(ctx: SimContext, key: string, value: T): void {
	ctx.data[key] = value;
}

export interface CreateSimContextOptions {
	rng: Rng;
	seed: number;
	tier: SimTier;
	db: DbOrTx;
	jornadasToAdvance?: number;
	temporadas?: number;
}

export function createSimContext(options: CreateSimContextOptions): SimContext {
	// Copia defensiva: SIM_TIERS[tier] es un singleton compartido por todo el
	// proceso — si algún contribuidor (o un test) mutara ctx.params en sitio,
	// corrompería la definición del tier para el resto de la corrida/proceso.
	const params = { ...SIM_TIERS[options.tier] };
	const jornadasToAdvance = options.jornadasToAdvance ?? params.maxJornadasPerRun;

	if (
		jornadasToAdvance < params.minJornadasPerRun ||
		jornadasToAdvance > params.maxJornadasPerRun
	) {
		throw new Error(
			`createSimContext: jornadasToAdvance (${jornadasToAdvance}) fuera de rango ` +
				`[${params.minJornadasPerRun}, ${params.maxJornadasPerRun}] para el tier "${options.tier}".`,
		);
	}

	return {
		rng: options.rng,
		seed: options.seed,
		tier: options.tier,
		params,
		jornadasToAdvance,
		temporadas: options.temporadas ?? 1,
		db: options.db,
		data: {},
	};
}

/**
 * Contrato que implementa cada módulo del simulador (identity, structure,
 * enrollment, calendar, matchplay, aggregates, discipline, playoffs…).
 * Ver docs/ORGANIZATION-SIMULATOR.md §5 para el mapeo módulo → contribuidor.
 */
export interface Contributor {
	/** Nombre único — usado por otros contribuidores en `dependsOn`. */
	name: string;
	/** Nombres de contribuidores que deben haber corrido antes que este. */
	dependsOn: string[];
	contribute(ctx: SimContext): Promise<void>;
}

/**
 * Valida que el registro esté en orden topológico: ningún contribuidor
 * puede depender de otro que aparezca después (o de sí mismo, o de un
 * nombre duplicado). Lanza con un mensaje accionable si no es así — se
 * corre antes de ejecutar nada, para fallar rápido en dev.
 */
export function validateTopologicalOrder(
	contributors: readonly Contributor[],
	assumeSatisfied: readonly string[] = [],
): void {
	const seen = new Set<string>(assumeSatisfied);
	for (const contributor of contributors) {
		if (seen.has(contributor.name)) {
			throw new Error(`Contributor registry: "${contributor.name}" está duplicado en el registro.`);
		}
		for (const dep of contributor.dependsOn) {
			if (dep === contributor.name) {
				throw new Error(`Contributor registry: "${contributor.name}" depende de sí mismo.`);
			}
			if (!seen.has(dep)) {
				throw new Error(
					`Contributor registry: "${contributor.name}" depende de "${dep}", pero ese ` +
						`contribuidor no ha corrido todavía (o no existe). Revisa el orden del registro.`,
				);
			}
		}
		seen.add(contributor.name);
	}
}

/**
 * Corre los contribuidores en orden, después de validar que el registro
 * respeta el orden topológico declarado por sus `dependsOn`.
 */
export async function runContributors(
	contributors: readonly Contributor[],
	ctx: SimContext,
	/**
	 * Nombres de contribuidores que el caller garantiza que ya corrieron
	 * (p. ej. `runCascade` corriendo solo sobre una liga que YA tiene
	 * estructura/roster reales, sin pasar por `structure`/`venues`/
	 * `enrollment` en esta misma corrida). Sin esto, `validateTopologicalOrder`
	 * no tiene forma de distinguir "dependencia real no satisfecha" de
	 * "dependencia satisfecha en una fase anterior que no corrió aquí".
	 */
	assumeSatisfied: readonly string[] = [],
): Promise<void> {
	validateTopologicalOrder(contributors, assumeSatisfied);
	for (const contributor of contributors) {
		await contributor.contribute(ctx);
	}
}
