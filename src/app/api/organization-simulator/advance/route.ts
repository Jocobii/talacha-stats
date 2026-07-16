/**
 * POST /api/organization-simulator/advance
 *
 * Épica E, modo "avanzar liga existente" — complementa /api/organization-simulator
 * (que solo crea org/liga nueva). Este endpoint apunta a UNA liga real que ya
 * existe en la app (creada por el organizador, no por el simulador) y:
 *
 *   1. Si la liga no tiene equipos todavía: los crea (reusa
 *      contributors/structure.ts::createTeams) junto con un roster nuevo de
 *      global_players + league_members + inscriptions dimensionado
 *      exactamente a esta liga (no al tier — aquí no hay tier).
 *   2. Si ya tiene equipos: reusa los que existan tal cual (no crea roster
 *      nuevo, asume que ya está inscrito vía la app).
 *   3. Corre solo la cascada temporal (calendar → matchplay → aggregates →
 *      discipline) en un loop hasta el número de jornadas pedido o hasta
 *      jornada 20 ("hasta que haya campeón" = tabla completa de temporada
 *      regular). Nunca corre lógica de cierre de temporada/liguilla — esa
 *      épica no existe todavía, así que no hay riesgo de "cerrar" nada.
 *
 * Owner-only, misma guarda de producción/transacción que la ruta hermana.
 */

import { z } from "zod";
import { eq, sql, inArray } from "drizzle-orm";
import { db, leagues, teams, leagueMembers, inscriptions, globalPlayers, matchdays } from "@/db";
import type { Team, LeagueMember, Inscription, GlobalPlayer } from "@/db/schema";
import { env } from "@/shared/env";
import { apiSuccess, apiError } from "@/types";
import { getSessionUserFromRequest } from "@/shared/lib/auth";
import { createRng } from "@/db/simulator/rng";
import { IdentityGenerator } from "@/db/simulator/identity";
import { createSimContext, setData, JORNADAS_PER_TEMPORADA } from "@/db/simulator/context";
import { assertNotProductionDatabase, ProductionGuardError } from "@/db/simulator/guards";
import { insertInBatches } from "@/db/simulator/chunk";
import {
	runCascade,
	createTeams,
	buildBaseline,
	LEAGUES_KEY,
	TEAMS_KEY,
	GLOBAL_PLAYERS_KEY,
	LEAGUE_MEMBERS_KEY,
	INSCRIPTIONS_KEY,
	getMatchdays,
	getMatches,
	getMatchEvents,
	getMatchPlayerStats,
	getTeamStandingsSnapshots,
	getPlayerSeasonStats,
	getSuspensions,
} from "@/db/simulator/contributors";

const RequestSchema = z.object({
	leagueId: z.string().uuid(),
	mode: z.enum(["jornadas", "champion"]),
	jornadas: z.number().int().min(1).max(19).optional(),
	// Solo requeridos si la liga todavía no tiene equipos.
	teamsToCreate: z.number().int().min(6).max(16).optional(),
	playersPerTeamToCreate: z.number().int().min(7).max(14).optional(),
});

const MAX_LOOP_ITERATIONS = 10; // 10 × 5 jornadas cubre de sobra 1..20

export async function POST(request: Request) {
	const session = await getSessionUserFromRequest(request);
	if (!session) return apiError("No autenticado", 401);
	if (session.role !== "owner") return apiError("Sin permiso", 403);

	const body = await request.json().catch(() => null);
	const parsed = RequestSchema.safeParse(body);
	if (!parsed.success) return apiError(parsed.error.message, 400);
	const { leagueId, mode, teamsToCreate, playersPerTeamToCreate } = parsed.data;
	const jornadasRequested = parsed.data.jornadas ?? 5;

	try {
		assertNotProductionDatabase(env.DATABASE_URL);
	} catch (err) {
		if (err instanceof ProductionGuardError) return apiError(err.message, 400);
		throw err;
	}

	const league = await db.query.leagues.findFirst({ where: eq(leagues.id, leagueId) });
	if (!league) return apiError("Liga no encontrada", 404);

	const existingTeams = await db.select().from(teams).where(eq(teams.leagueId, leagueId));
	if (existingTeams.length === 0 && (!teamsToCreate || !playersPerTeamToCreate)) {
		return apiError(
			"Esta liga no tiene equipos todavía — manda teamsToCreate y playersPerTeamToCreate para crearlos.",
			400,
		);
	}

	let result;
	try {
		result = await db.transaction(async (tx) => {
			const seed = Math.floor(Math.random() * 1_000_000);
			const rng = createRng(seed);
			// tier "S" es solo un contenedor de defaults — ctx.params no lo lee
			// ningún contribuidor de la cascada (calendar/matchplay/aggregates/
			// discipline), solo lo leen los de bootstrap (identity/structure/
			// venues/enrollment), que aquí no corremos como Contributor sino que
			// llamamos directo a sus helpers exportados.
			const ctx = createSimContext({ rng, seed, tier: "S", db: tx });
			setData(ctx, LEAGUES_KEY, [league]);

			let teamRows: Team[] = existingTeams;
			let memberRows: LeagueMember[];
			let inscriptionRows: Inscription[];

			if (existingTeams.length === 0) {
				ctx.params.teamsPerLeague = teamsToCreate!;
				ctx.params.playersPerTeam = playersPerTeamToCreate!;

				teamRows = await createTeams(ctx, [league]);
				setData(ctx, TEAMS_KEY, teamRows);

				const slots = teamRows.length * playersPerTeamToCreate!;
				const existingKeys = await tx
					.select({
						fullNameCanonical: globalPlayers.fullNameCanonical,
						curpHash: globalPlayers.curpHash,
					})
					.from(globalPlayers);
				const generator = new IdentityGenerator(ctx.rng);
				generator.seedExisting(existingKeys);
				const identities = generator.nextN(slots);

				const playerRows: GlobalPlayer[] = await insertInBatches(
					identities.map((i) => ({
						curpHash: i.curpHash,
						fullName: i.fullName,
						fullNameCanonical: i.fullNameCanonical,
						birthDate: i.birthDate,
					})),
					(batch) => tx.insert(globalPlayers).values(batch).returning(),
				);
				setData(ctx, GLOBAL_PLAYERS_KEY, playerRows);

				const baseline = buildBaseline(ctx, [league], teamRows);
				memberRows = await insertInBatches(baseline.memberDefs, (batch) =>
					tx.insert(leagueMembers).values(batch).returning(),
				);
				const inscriptionDefs = memberRows.map((member, i) => ({
					leagueMemberId: member.id,
					teamId: baseline.teamIdByIndex[i],
				}));
				inscriptionRows = await insertInBatches(inscriptionDefs, (batch) =>
					tx.insert(inscriptions).values(batch).returning(),
				);
			} else {
				setData(ctx, TEAMS_KEY, teamRows);
				memberRows = await tx
					.select()
					.from(leagueMembers)
					.where(eq(leagueMembers.leagueId, leagueId));
				const memberIds = memberRows.map((m) => m.id);
				inscriptionRows =
					memberIds.length > 0
						? await tx
								.select()
								.from(inscriptions)
								.where(inArray(inscriptions.leagueMemberId, memberIds))
						: [];
				if (memberRows.length === 0) {
					throw new ApiRouteError(
						"Esta liga ya tiene equipos pero ningún jugador inscrito (league_members vacío) — " +
							"inscribe jugadores desde la app antes de avanzar jornadas.",
					);
				}
			}
			setData(ctx, LEAGUE_MEMBERS_KEY, memberRows);
			setData(ctx, INSCRIPTIONS_KEY, inscriptionRows);

			const maxRow = await tx
				.select({ max: sql<number | null>`max(${matchdays.number})` })
				.from(matchdays)
				.where(eq(matchdays.leagueId, leagueId));
			let currentMax = maxRow[0]?.max ?? 0;
			const target =
				mode === "champion"
					? JORNADAS_PER_TEMPORADA
					: Math.min(currentMax + jornadasRequested, JORNADAS_PER_TEMPORADA);

			if (currentMax >= target) {
				return {
					leagueId,
					leagueName: league.name,
					startedAtJornada: currentMax,
					endedAtJornada: currentMax,
					teamsCreated: existingTeams.length === 0 ? teamRows.length : 0,
					playersCreated: existingTeams.length === 0 ? memberRows.length : 0,
					note:
						currentMax >= JORNADAS_PER_TEMPORADA
							? "Esta liga ya completó las 20 jornadas de la temporada regular (ya hay campeón)."
							: "Nada que avanzar: la liga ya está en la jornada pedida o más adelante.",
					counts: emptyCounts(),
				};
			}

			const startedAtJornada = currentMax;
			let iterations = 0;
			// runCascade() sobrescribe ctx.data con SOLO lo que produjo esa vuelta
			// (por diseño — cada corrida de cascada solo debe ver "lo nuevo").
			// Cuando esta ruta necesita más de una vuelta para llegar a la meta
			// (jornadasRequested/target > 5), hay que sumar cada vuelta a mano en
			// vez de leer ctx.data una sola vez al final.
			const totals = emptyCounts();
			while (currentMax < target && iterations < MAX_LOOP_ITERATIONS) {
				iterations++;
				ctx.jornadasToAdvance = Math.min(5, target - currentMax);
				await runCascade(ctx);
				const createdThisRun = getMatchdays(ctx).length;
				if (createdThisRun === 0) break; // tope de 20 alcanzado o nada que hacer — no loop infinito
				currentMax += createdThisRun;

				totals.matchdays += createdThisRun;
				totals.matches += getMatches(ctx).length;
				totals.matchEvents += getMatchEvents(ctx).length;
				totals.matchPlayerStats += getMatchPlayerStats(ctx).length;
				totals.teamStandingsSnapshot += getTeamStandingsSnapshots(ctx).length;
				totals.playerSeasonStats += getPlayerSeasonStats(ctx).length;
				totals.suspensions += getSuspensions(ctx).length;
			}

			return {
				leagueId,
				leagueName: league.name,
				startedAtJornada,
				endedAtJornada: currentMax,
				teamsCreated: existingTeams.length === 0 ? teamRows.length : 0,
				playersCreated: existingTeams.length === 0 ? memberRows.length : 0,
				note:
					currentMax >= JORNADAS_PER_TEMPORADA
						? "Temporada regular completa (20 jornadas) — revisa la tabla para ver al líder/campeón. No se cerró la temporada ni se corrió liguilla."
						: null,
				counts: totals,
			};
		});
	} catch (err) {
		if (err instanceof ApiRouteError) return apiError(err.message, 400);
		throw err;
	}

	return apiSuccess(result, 201);
}

function emptyCounts() {
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

class ApiRouteError extends Error {}
