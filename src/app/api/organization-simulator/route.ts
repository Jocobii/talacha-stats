/**
 * POST /api/organization-simulator
 *
 * Épica E (docs/ORGANIZATION-SIMULATOR.md) — API detrás de
 * /admin/organization-simulator. Corre el pipeline completo del simulador
 * (Épicas B+C: identidad, estructura, cascada temporal) dentro de una sola
 * transacción, contra la misma DB que ya usa la app (no abre un Pool nuevo
 * como el CLI standalone en src/db/simulate.ts).
 *
 * Owner-only — mismo criterio que /admin/temas y /api/organizations/[id]/approve.
 *
 * Límites conocidos (heredados del motor, no de esta ruta):
 *   - "escenario" y "temporadas: N" (§E2 del doc) no están implementados en
 *     los contribuidores todavía — esta ruta los ignora si vienen en el body.
 *   - "org destino" solo soporta agregar liga(s) nueva(s) a una org
 *     existente (bootstrap). Avanzar una liga ya generada (solo jornadas,
 *     sin crear nada nuevo) requiere precargar más ctx.data — no está
 *     expuesto en esta primera versión de la UI.
 */

import { z } from "zod";
import { db, organizations } from "@/db";
import { eq } from "drizzle-orm";
import { env } from "@/shared/env";
import { apiSuccess, apiError } from "@/types";
import { getSessionUserFromRequest } from "@/shared/lib/auth";
import { createRng } from "@/db/simulator/rng";
import {
	createSimContext,
	setData,
	SIM_TIERS,
	JORNADAS_PER_TEMPORADA,
	type SimTier,
} from "@/db/simulator/context";
import {
	assertNotProductionDatabase,
	assertReasonableVolume,
	ProductionGuardError,
} from "@/db/simulator/guards";
import {
	runBootstrap,
	runCascade,
	ORGANIZATIONS_KEY,
	getOrganizations,
	getGlobalPlayers,
	getLeagues,
	getTeams,
	getVenues,
	getLeagueMembers,
	getInscriptions,
	getMatchdays,
	getMatches,
	getMatchEvents,
	getMatchPlayerStats,
	getTeamStandingsSnapshots,
	getPlayerSeasonStats,
	getSuspensions,
} from "@/db/simulator/contributors";

const RequestSchema = z.object({
	tier: z.enum(["S", "M", "L", "XL"]),
	seed: z.number().int().optional(),
	// "jornadas": avanza 1–5 jornadas en una sola vuelta (comportamiento previo).
	// "champion": corre la temporada regular completa (hasta jornada 20) para
	// que la tabla tenga un campeón claro, igual que el modo "Mi liga".
	mode: z.enum(["jornadas", "champion"]).default("jornadas"),
	jornadas: z.number().int().min(1).max(5).optional(),
	organizationId: z.string().uuid().optional(),
});

// 4 vueltas de 5 jornadas cubren de sobra 1..20; el guard evita loop infinito.
const MAX_LOOP_ITERATIONS = 6;

export async function POST(request: Request) {
	const session = await getSessionUserFromRequest(request);
	if (!session) return apiError("No autenticado", 401);
	if (session.role !== "owner") return apiError("Sin permiso", 403);

	const body = await request.json().catch(() => null);
	const parsed = RequestSchema.safeParse(body);
	if (!parsed.success) return apiError(parsed.error.message, 400);

	const { tier, organizationId, mode } = parsed.data;
	const seed = parsed.data.seed ?? Math.floor(Math.random() * 1_000_000);
	const params = SIM_TIERS[tier as SimTier];
	// Meta de jornadas: temporada completa (20) en modo campeón, o el número
	// pedido (1–5) en modo jornadas.
	const target =
		mode === "champion"
			? JORNADAS_PER_TEMPORADA
			: (parsed.data.jornadas ?? params.maxJornadasPerRun);

	try {
		assertNotProductionDatabase(env.DATABASE_URL);
		assertReasonableVolume({ orgs: params.orgs, leaguesPerOrg: params.leaguesPerOrg });
	} catch (err) {
		if (err instanceof ProductionGuardError) return apiError(err.message, 400);
		throw err;
	}

	let targetOrg = null;
	if (organizationId) {
		targetOrg = await db.query.organizations.findFirst({
			where: eq(organizations.id, organizationId),
		});
		if (!targetOrg) return apiError("Organización destino no encontrada", 404);
	}

	const result = await db.transaction(async (tx) => {
		const rng = createRng(seed);
		const ctx = createSimContext({ rng, seed, tier, db: tx });

		if (targetOrg) setData(ctx, ORGANIZATIONS_KEY, [targetOrg]);

		// Bootstrap (identidad + estructura) una sola vez…
		await runBootstrap(ctx);

		// …y luego la cascada temporal en vueltas de ≤5 jornadas hasta la meta.
		// runCascade sobrescribe ctx.data con SOLO lo que produjo esa vuelta, así
		// que acumulamos los conteos a mano y guardamos la última tabla generada
		// para el preview del resumen.
		const cascadeTotals = emptyCascadeCounts();
		let jornadasDone = 0;
		let iterations = 0;
		let standings: ReturnType<typeof getTeamStandingsSnapshots> = [];
		while (jornadasDone < target && iterations < MAX_LOOP_ITERATIONS) {
			iterations++;
			ctx.jornadasToAdvance = Math.min(5, target - jornadasDone);
			await runCascade(ctx);
			const createdMatchdays = getMatchdays(ctx);
			if (createdMatchdays.length === 0) break; // todas las ligas llegaron a 20
			jornadasDone += ctx.jornadasToAdvance;
			cascadeTotals.matchdays += createdMatchdays.length;
			cascadeTotals.matches += getMatches(ctx).length;
			cascadeTotals.matchEvents += getMatchEvents(ctx).length;
			cascadeTotals.matchPlayerStats += getMatchPlayerStats(ctx).length;
			cascadeTotals.teamStandingsSnapshot += getTeamStandingsSnapshots(ctx).length;
			cascadeTotals.playerSeasonStats += getPlayerSeasonStats(ctx).length;
			cascadeTotals.suspensions += getSuspensions(ctx).length;
			standings = getTeamStandingsSnapshots(ctx);
		}

		const orgsOut = getOrganizations(ctx);
		const leaguesOut = getLeagues(ctx);
		const teamsOut = getTeams(ctx);

		// Tabla resultante — última jornada de la primera liga generada, para
		// que el resumen se sienta como el de /admin/seed-liga (E3).
		const firstLeague = leaguesOut[0] ?? null;
		let previewStandings: {
			teamId: string;
			teamName: string;
			jornada: number;
			played: number;
			wins: number;
			draws: number;
			losses: number;
			goalsFor: number;
			goalsAgainst: number;
			points: number;
		}[] = [];

		if (firstLeague) {
			const leagueSnapshots = standings.filter((s) => s.leagueId === firstLeague.id);
			const lastJornada = leagueSnapshots.reduce((max, s) => Math.max(max, s.jornada), 0);
			const teamNameById = new Map(teamsOut.map((t) => [t.id, t.name]));
			previewStandings = leagueSnapshots
				.filter((s) => s.jornada === lastJornada)
				.map((s) => ({
					teamId: s.teamId,
					teamName: teamNameById.get(s.teamId) ?? "—",
					jornada: s.jornada,
					played: s.played,
					wins: s.wins,
					draws: s.draws,
					losses: s.losses,
					goalsFor: s.goalsFor,
					goalsAgainst: s.goalsAgainst,
					points: s.points,
				}))
				.sort(
					(a, b) =>
						b.points - a.points || b.goalsFor - b.goalsAgainst - (a.goalsFor - a.goalsAgainst),
				);
		}

		return {
			tier,
			seed,
			jornadasAdvanced: jornadasDone,
			note:
				mode === "champion"
					? "Temporada regular completa (20 jornadas) — la tabla muestra al líder/campeón. Todavía no se corre liguilla (Épica C5)."
					: null,
			organizations: orgsOut.map((o) => ({ id: o.id, name: o.name, slug: o.slug })),
			leagues: leaguesOut.map((l) => ({ id: l.id, name: l.name, slug: l.slug, city: l.city })),
			counts: {
				globalPlayers: getGlobalPlayers(ctx).length,
				teams: teamsOut.length,
				venues: getVenues(ctx).length,
				leagueMembers: getLeagueMembers(ctx).length,
				inscriptions: getInscriptions(ctx).length,
				matchdays: cascadeTotals.matchdays,
				matches: cascadeTotals.matches,
				matchEvents: cascadeTotals.matchEvents,
				matchPlayerStats: cascadeTotals.matchPlayerStats,
				teamStandingsSnapshot: cascadeTotals.teamStandingsSnapshot,
				playerSeasonStats: cascadeTotals.playerSeasonStats,
				suspensions: cascadeTotals.suspensions,
			},
			previewLeague: firstLeague ? { id: firstLeague.id, name: firstLeague.name } : null,
			previewStandings,
		};
	});

	return apiSuccess(result, 201);
}

/** Conteos de la cascada que se acumulan entre vueltas de runCascade. */
function emptyCascadeCounts() {
	return {
		matchdays: 0,
		matches: 0,
		matchEvents: 0,
		matchPlayerStats: 0,
		teamStandingsSnapshot: 0,
		playerSeasonStats: 0,
		suspensions: 0,
	};
}
