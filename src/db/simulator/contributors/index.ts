/**
 * src/db/simulator/contributors/index.ts
 *
 * Registro ordenado de contribuidores — ver docs/ORGANIZATION-SIMULATOR.md
 * §5 y §9 (cierre de Épicas B y C). Esta es la ÚNICA lista que el CLI/API
 * de la Épica E necesita importar para correr una corrida completa.
 *
 * Agregar un contribuidor nuevo (scheduling-extras, playoffs… Épica C5+)
 * es: crear el archivo en `src/db/simulator/contributors/`, exportarlo
 * aquí, y añadirlo al arreglo en su posición topológica. `runContributors`
 * (context.ts) valida el orden en cada corrida — un contribuidor mal
 * ubicado revienta con un mensaje claro, no en silencio.
 *
 * Dos grupos, porque no siempre se necesitan juntos:
 *   - BOOTSTRAP_CONTRIBUTORS (Épica B): identidad + estructura de una org
 *     nueva. Corre una sola vez por org/liga.
 *   - CASCADE_CONTRIBUTORS (Épica C): la cadena temporal — jornadas,
 *     partidos, agregados, disciplina. Corre en cada avance de 1–5
 *     jornadas, ya sea justo después del bootstrap o, más adelante (Épica
 *     E), sobre una liga existente con `ctx.data` precargado desde DB.
 */

import { runContributors, type SimContext } from "../context";
import { identityContributor } from "./identity";
import { structureContributor } from "./structure";
import { venuesContributor } from "./venues";
import { enrollmentContributor } from "./enrollment";
import { calendarContributor } from "./calendar";
import { matchplayContributor } from "./matchplay";
import { aggregatesContributor } from "./aggregates";
import { disciplineContributor } from "./discipline";

export const BOOTSTRAP_CONTRIBUTORS = [
	identityContributor,
	structureContributor,
	venuesContributor,
	enrollmentContributor,
];

export const CASCADE_CONTRIBUTORS = [
	calendarContributor,
	matchplayContributor,
	aggregatesContributor,
	disciplineContributor,
];

export const FULL_RUN_CONTRIBUTORS = [...BOOTSTRAP_CONTRIBUTORS, ...CASCADE_CONTRIBUTORS];

/** Corre solo el pipeline de bootstrap (Épica B) sobre un SimContext. */
export async function runBootstrap(ctx: SimContext): Promise<void> {
	await runContributors(BOOTSTRAP_CONTRIBUTORS, ctx);
}

/**
 * Corre solo la cascada temporal (Épica C) — requiere que el caller haya
 * precargado `ctx.data` con lo que normalmente producen `structure`/`venues`/
 * `enrollment` (LEAGUES_KEY, TEAMS_KEY, LEAGUE_MEMBERS_KEY, INSCRIPTIONS_KEY),
 * ya sea porque los generó el bootstrap en esta misma corrida o porque ya
 * existían en DB de una liga real (Épica E, modo "avanzar liga existente").
 * `assumeSatisfied` es lo que le dice a `validateTopologicalOrder` que esas
 * tres fases "ya corrieron" aunque no estén en este arreglo.
 */
export async function runCascade(ctx: SimContext): Promise<void> {
	await runContributors(CASCADE_CONTRIBUTORS, ctx, [
		"identity",
		"structure",
		"venues",
		"enrollment",
	]);
}

/** Bootstrap + cascada en una sola corrida — el caso común para una org nueva. */
export async function runFullBootstrap(ctx: SimContext): Promise<void> {
	await runContributors(FULL_RUN_CONTRIBUTORS, ctx);
}

export * from "./identity";
export * from "./structure";
export * from "./venues";
export * from "./enrollment";
export * from "./calendar";
export * from "./matchplay";
export * from "./aggregates";
export * from "./discipline";
